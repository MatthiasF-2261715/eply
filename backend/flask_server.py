from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging
import os
import json
import tempfile
import pickle
import base64
from openai import OpenAI
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import re
import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/dist')
CORS(app, resources={r"/*": {
    "origins": "*", 
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "OPTIONS"]
}})

# OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Gmail API scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", 
         "https://www.googleapis.com/auth/gmail.modify", 
         "https://www.googleapis.com/auth/gmail.compose"]

# Google OAuth credentials
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

def authenticate_gmail():
    """Authenticate with OAuth 2.0 and return the Gmail API service."""
    creds = None

    # Get credentials file path
    credentials_file = get_credentials_file()
    if not credentials_file:
        raise Exception("No credentials available - check GOOGLE_CREDENTIALS_JSON environment variable")

    # Try to load saved credentials
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)

    # If no valid credentials, go through OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_file, SCOPES)
            creds = flow.run_local_server(port=8080)

        # Save credentials for future sessions
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)

    # Create the Gmail service
    service = build("gmail", "v1", credentials=creds)
    return service

def decode_email_body(payload):
    """Recursively decode email body parts."""
    body = ""
    
    # First check if this is a multipart message
    if 'parts' in payload:
        # Process multipart messages differently to avoid duplication
        has_html = False
        html_content = ""
        plain_content = ""
        
        # First pass: identify if we have HTML content
        for part in payload['parts']:
            mime_type = part.get('mimeType', '').lower()
            if 'html' in mime_type:
                has_html = True
                content = decode_email_body(part)
                if content:
                    html_content = content
                    break
        
        # If we have HTML content, just use that
        if has_html and html_content:
            return html_content
        
        # Otherwise, collect all parts
        for part in payload['parts']:
            mime_type = part.get('mimeType', '').lower()
            if 'text/plain' in mime_type:
                content = decode_email_body(part)
                if content:
                    plain_content = content
            elif not has_html:  # Only process other parts if we don't have HTML
                body += decode_email_body(part)
        
        # Prefer HTML, then plain text, then other parts
        if html_content:
            return html_content
        elif plain_content:
            # Convert plain text to HTML
            return plain_content.replace('\n', '<br>')
        else:
            return body
            
    elif 'body' in payload and 'data' in payload['body']:
        data = payload['body']['data']
        # Decode Base64
        decoded_bytes = base64.urlsafe_b64decode(data)
        body = decoded_bytes.decode('utf-8', errors='replace')
        
        # Handle email MIME types
        mime_type = payload.get('mimeType', '').lower()
        if 'html' in mime_type:
            # It's already HTML content
            pass
        elif 'text/plain' in mime_type:
            # Convert plain text to HTML with line breaks
            body = body.replace('\n', '<br>')
    
    return body

def get_email_content(service, msg_id):
    """Get email content from Gmail API."""
    try:
        msg = service.users().messages().get(userId="me", id=msg_id).execute()
        
        payload = msg["payload"]
        headers = payload["headers"]
        
        # Initialize values
        from_email = ""
        subject = ""
        date = ""
        
        # Get header values
        for header in headers:
            if header["name"].lower() == "from":
                from_email = header["value"]
            elif header["name"].lower() == "subject":
                subject = header["value"]
            elif header["name"].lower() == "date":
                date = header["value"]
        
        # Get email body
        body = decode_email_body(payload)
        
        return {
            "id": msg_id,
            "from": from_email,
            "subject": subject,
            "date": date,
            "body": body,
            "snippet": msg.get("snippet", "")
        }
    except Exception as e:
        logger.error(f"Error getting email content: {str(e)}")
        return None

def truncate_text(text, max_length=2000):
    """Truncate text to a maximum length."""
    if len(text) <= max_length:
        return text
    
    # Try to find a sentence ending near the limit
    truncated = text[:max_length]
    last_period = truncated.rfind('.')
    
    if last_period > max_length * 0.75:  # Only use sentence truncation if it's not too short
        return truncated[:last_period+1] + " [TRUNCATED...]"
    else:
        return truncated + " [TRUNCATED...]"

def generate_reply(email_body, style_analysis=None):
    """Generate AI-based reply to email based on received email and user's style."""
    try:
        # Clean up the email body - remove any quoted text or signatures
        cleaned_body = email_body
        
        # Find common signature markers and trim them
        signature_markers = ["--", "Best regards", "Kind regards", "Regards", "Thanks", "Thank you", 
                             "Met vriendelijke groet", "Vriendelijke groeten", "Groeten", "Bedankt", "Alvast bedankt", "MVG"]
        for marker in signature_markers:
            sig_pos = cleaned_body.find(marker)
            if sig_pos > 0:
                cleaned_body = cleaned_body[:sig_pos].strip()
        
        # Remove any subject line that might appear at the beginning
        lines = cleaned_body.split('\n')
        if lines and (lines[0].startswith('Subject:') or lines[0].lower().startswith('re:') or ':' in lines[0][:30]):
            lines = lines[1:]
            cleaned_body = '\n'.join(lines)

        # Truncate the email body to avoid token limit issues
        truncated_body = truncate_text(cleaned_body)
        logger.debug(f"Original email length: {len(email_body)}, Cleaned length: {len(cleaned_body)}, Truncated length: {len(truncated_body)}")
        
        # Create system prompt based on style analysis
        system_prompt = "You are an assistant helping write email replies that match the user's writing style."
        
        if style_analysis:
            # Determine language
            language = style_analysis.get("dominant_language", "English")
            
            # Determine formality
            formality = style_analysis.get("formality_level", "balanced")
            
            # Determine role/persona
            role = style_analysis.get("primary_role", "general")
            
            # Create more specific system prompt
            system_prompt = f"""
            You are an assistant helping write email replies that perfectly match the user's writing style.
            
            Based on analysis of their sent emails:
            - They typically write in {language}
            - Their writing style is {formality}
            - Their communications suggest they're in a {role} context
            
            Write a reply that sounds exactly like they would write it. Match their:
            - Greeting style 
            - Closing style
            - Level of formality and tone
            - Typical phrases and expressions
            
            Reply in {language} unless the received email is clearly in another language.
            """
        
        # Use style analysis for more personalized prompt
        user_prompt = f"This is the email I received:\n\n{truncated_body}\n\nWrite a reply that sounds natural and in my own voice:"
        
        if style_analysis:
            greeting_examples = ', '.join(style_analysis.get('greeting_patterns', [])[:2])
            closing_examples = ', '.join(style_analysis.get('closing_patterns', [])[:2])
            
            if greeting_examples or closing_examples:
                user_prompt = f"""
                This is the email I received:
                
                {truncated_body}
                
                Write a reply that matches my personal writing style with these characteristics:
                
                {f"My typical greetings: {greeting_examples}" if greeting_examples else ""}
                {f"My typical closings: {closing_examples}" if closing_examples else ""}
                Formality level: {style_analysis.get('formality_level', 'balanced')}
                
                Make sure your reply sounds natural and in my own voice.
                """
        
        # Generate reply using OpenAI
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content.strip()
        
        # Make sure the reply doesn't repeat the subject line
        reply_lines = reply.split('\n')
        if reply_lines and (reply_lines[0].lower().startswith('subject:') or reply_lines[0].lower().startswith('re:')):
            reply = '\n'.join(reply_lines[1:])
        
        return reply
    except Exception as e:
        logger.error(f"Error generating reply: {str(e)}")
        return None

# Add the missing extract_token function
def extract_token(request):
    """Extract bearer token from request headers."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
    return None

def extract_sender_name(email_data):
    """Extract sender's name from email body or 'from' field."""
    try:
        # Try to extract from the 'From' header first
        from_field = email_data.get("from", "")
        
        # Common email format is "Name <email@example.com>"
        name_match = re.match(r'^([^<]+)<', from_field)
        if name_match:
            name = name_match.group(1).strip()
            # If name has quotes, remove them
            if name.startswith('"') and name.endswith('"'):
                name = name[1:-1]
            if name:
                return name
        
        # If no name in from field, try to extract from email body
        body = email_data.get("body", "")
        
        # Try to find signature blocks
        signature_markers = ["--", "Best regards", "Kind regards", "Regards", "Thanks", "Thank you", 
                             "Met vriendelijke groet", "Vriendelijke groeten", "Groeten", "MVG"]
        
        for marker in signature_markers:
            sig_pos = body.lower().find(marker.lower())
            if sig_pos > 0:
                # Look for a name in the line after the signature marker
                signature_block = body[sig_pos:sig_pos+150]  # Get a chunk after the marker
                lines = signature_block.split('\n')
                
                # First check if there's a name on the same line
                first_line = lines[0]
                if len(first_line) > len(marker) + 2:
                    # There's additional content on the signature line
                    potential_name = first_line[first_line.lower().find(marker.lower()) + len(marker):].strip()
                    if potential_name and len(potential_name.split()) <= 3:
                        return potential_name
                
                # Check the next 1-2 lines for a potential name
                if len(lines) > 1:
                    for i in range(1, min(3, len(lines))):
                        potential_name = lines[i].strip()
                        # Consider it a name if it's not too long and doesn't look like an email/link
                        if potential_name and len(potential_name.split()) <= 3 and '@' not in potential_name and 'http' not in potential_name:
                            return potential_name
        
        # Extract first name from email address as last resort
        if '@' in from_field:
            email_part = from_field[from_field.find('<')+1:from_field.find('>')] if '<' in from_field else from_field
            username = email_part.split('@')[0]
            # Clean up the username to get a name-like string
            username = re.sub(r'[0-9_.-]+', ' ', username).strip()
            if username:
                # Capitalize each word for a more name-like appearance
                return ' '.join(word.capitalize() for word in username.split())
        
        return ""
    except Exception as e:
        logger.error(f"Error extracting sender name: {str(e)}")
        return ""

@app.route('/auth/token', methods=['POST'])
def token_exchange():
    """Exchange an authorization code for access and refresh tokens."""
    try:
        data = request.json
        code = data.get('code')
        redirect_uri = data.get('redirect_uri')
        
        if not code:
            return jsonify({"error": "Authorization code is required"}), 400
            
        # Get credentials file path
        credentials_file = get_credentials_file()
        if not credentials_file:
            return jsonify({"error": "No Google credentials available"}), 500
            
        # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow
        flow = InstalledAppFlow.from_client_secrets_file(
            credentials_file, 
            SCOPES, 
            redirect_uri=redirect_uri or os.environ.get("REDIRECT_URI", "https://eply.onrender.com")
        )
        
        # Exchange the authorization code for credentials
        flow.fetch_token(code=code)
        
        # Get the credentials
        creds = flow.credentials
        
        # Save user-specific credentials
        import hashlib
        user_id_hash = hashlib.md5(creds.client_id.encode()).hexdigest()
        
        token_cache_dir = "token_cache"
        if not os.path.exists(token_cache_dir):
            os.makedirs(token_cache_dir)
            
        user_token_file = os.path.join(token_cache_dir, f"user_{user_id_hash}.pickle")
        
        with open(user_token_file, "wb") as f:
            pickle.dump(creds, f)
        
        # Return the tokens to the client
        return jsonify({
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "expires_in": (creds.expiry.timestamp() - datetime.datetime.now().timestamp()) if creds.expiry else None,
            "token_type": "Bearer"
        })
        
    except Exception as e:
        logger.error(f"Error in token exchange: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/auth/url', methods=['GET'])
def get_auth_url():
    """Get Google OAuth authorization URL."""
    try:
        redirect_uri = request.args.get('redirect_uri', os.environ.get("REDIRECT_URI", 'https://eply.onrender.com/oauth-callback'))
        
        # Get credentials file path
        credentials_file = get_credentials_file()
        if not credentials_file:
            return jsonify({"error": "No Google credentials available"}), 500
        
        # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow
        flow = InstalledAppFlow.from_client_secrets_file(
            credentials_file, 
            SCOPES, 
            redirect_uri=redirect_uri
        )
        
        # Generate authorization URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            prompt='consent',  # Force to always prompt for consent
            include_granted_scopes='true'
        )
        
        return jsonify({"auth_url": auth_url})
        
    except Exception as e:
        logger.error(f"Error getting auth URL: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh an expired access token using a refresh token."""
    try:
        data = request.json
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({"error": "Refresh token is required"}), 400
            
        # Set up credentials with refresh token
        from google.oauth2.credentials import Credentials
        import google.auth.transport.requests
        
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            scopes=SCOPES
        )
        
        # Refresh the credentials
        request_adapter = google.auth.transport.requests.Request()
        creds.refresh(request_adapter)
        
        # Save the refreshed credentials
        import hashlib
        user_id_hash = hashlib.md5(creds.client_id.encode()).hexdigest()
        
        token_cache_dir = "token_cache"
        if not os.path.exists(token_cache_dir):
            os.makedirs(token_cache_dir)
            
        user_token_file = os.path.join(token_cache_dir, f"user_{user_id_hash}.pickle")
        
        with open(user_token_file, "wb") as f:
            pickle.dump(creds, f)
        
        # Return the new tokens
        return jsonify({
            "access_token": creds.token,
            "expires_in": (creds.expiry.timestamp() - datetime.datetime.now().timestamp()) if creds.expiry else None,
            "token_type": "Bearer"
        })
        
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        return jsonify({"error": str(e)}), 500

def analyze_writing_style(sent_emails):
    """Analyze writing style patterns from sent emails."""
    try:
        # Initialize collections for style analysis
        greetings = []
        closings = []
        phrases = []
        formality_scores = []
        languages = []
        topics = []
        
        # Common greeting patterns to look for
        greeting_patterns = [
            r"(hey|hi|hello|dear|beste|hallo|hoi|geachte)[\s\w]+,",
            r"^[^,\n]{2,30},",  # Captures short phrases followed by comma at start of email
            r"^(good|goeie|goede)\s(morning|afternoon|evening|day|middag|morgen|avond|dag)",
        ]
        
        # Common closing patterns to look for
        closing_patterns = [
            r"(regards|sincerely|cheers|thanks|thank you|met vriendelijke groet|groeten|met dank|hartelijk dank|bedankt|mvg)\s*,",
            r"(best|kind|warm|vriendelijke|hartelijke)\s+(regards|groet|groeten)",
        ]
        
        # Analyze each email
        for email in sent_emails:
            body = email.get("body", "").lower()
            if not body:
                continue
                
            # Try to detect language
            nl_indicators = len(re.findall(r'\b(en|het|een|van|met|voor|dat|niet|deze|zijn)\b', body))
            en_indicators = len(re.findall(r'\b(the|and|to|of|in|is|that|for|it|with)\b', body))
            
            if nl_indicators > en_indicators and nl_indicators > 5:
                languages.append("Dutch")
            elif en_indicators > nl_indicators and en_indicators > 5:
                languages.append("English")
            
            # Extract lines for analysis
            lines = [line.strip() for line in body.split('\n') if line.strip()]
            
            # Check for greetings in the first few lines
            for i in range(min(3, len(lines))):
                for pattern in greeting_patterns:
                    matches = re.findall(pattern, lines[i], re.IGNORECASE)
                    if matches:
                        greetings.append(lines[i])
                        break
            
            # Check for closings in the last few lines
            for i in range(max(0, len(lines)-5), len(lines)):
                for pattern in closing_patterns:
                    matches = re.findall(pattern, lines[i], re.IGNORECASE)
                    if matches:
                        closings.append(lines[i])
                        break
            
            # Calculate formality score
            formal_indicators = len(re.findall(r'\b(therefore|however|furthermore|accordingly|consequently|met vriendelijke groet|geachte|hoogachtend|tevens|derhalve|desbetreffende|aangezien)\b', body, re.IGNORECASE))
            informal_indicators = len(re.findall(r'\b(btw|lol|haha|hey|cool|awesome|thanks|cheers|groetjes|hoi|doei|leuk|geweldig|trouwens)\b', body, re.IGNORECASE))
            
            # Adjust for length bias
            word_count = len(body.split())
            formality_score = 0  # neutral
            if word_count > 20:
                normalized_formal = formal_indicators / (word_count / 100)
                normalized_informal = informal_indicators / (word_count / 100)
                
                if normalized_formal > normalized_informal * 2:
                    formality_score = 1  # formal
                elif normalized_informal > normalized_formal * 2:
                    formality_score = -1  # informal
                
            formality_scores.append(formality_score)
            
            # Extract common phrases (3-5 words)
            words = re.findall(r'\b\w+\b', body)
            for i in range(len(words) - 2):
                if i + 5 <= len(words):
                    five_gram = ' '.join(words[i:i+5])
                    phrases.append(five_gram)
                if i + 4 <= len(words):
                    four_gram = ' '.join(words[i:i+4])
                    phrases.append(four_gram)
                three_gram = ' '.join(words[i:i+3])
                phrases.append(three_gram)
            
            # Check for common topics/roles
            topic_indicators = {
                "student": len(re.findall(r'\b(study|college|university|course|assignment|professor|lecture|thesis|student|class|exam|universiteit|studie|tentamen|college|docent|studeren|studiepunten|opdracht)\b', body, re.IGNORECASE)),
                "professional": len(re.findall(r'\b(meeting|deadline|project|client|business|company|office|team|manager|report|presentation|contract|budget|vergadering|project|klant|bedrijf|kantoor|team|manager|rapport|presentatie|contract|budget)\b', body, re.IGNORECASE)),
                "technical": len(re.findall(r'\b(software|code|programming|develop|engineer|system|data|tech|api|server|application|database|software|code|programmeren|ontwikkel|engineer|systeem|data|tech|api|server|applicatie|database)\b', body, re.IGNORECASE)),
            }
            
            if any(count > 3 for count in topic_indicators.values()):
                max_topic = max(topic_indicators.items(), key=lambda x: x[1])
                topics.append(max_topic[0])
        
        # Process collected data
        # Find most common phrases that appear multiple times
        phrase_counter = {}
        for phrase in phrases:
            if phrase in phrase_counter:
                phrase_counter[phrase] += 1
            else:
                phrase_counter[phrase] = 1
                
        common_phrases = [phrase for phrase, count in phrase_counter.items() 
                         if count > 1 and len(phrase) > 10]
        
        # Determine formality level
        avg_formality = sum(formality_scores) / len(formality_scores) if formality_scores else 0
        formality_level = "formal" if avg_formality > 0.3 else "informal" if avg_formality < -0.3 else "balanced"
        
        # Determine dominant language
        dominant_language = "English"
        if languages:
            nl_count = languages.count("Dutch")
            en_count = languages.count("English")
            dominant_language = "Dutch" if nl_count > en_count else "English"
        
        # Determine common role/persona
        primary_role = "general"
        if topics:
            role_counts = {}
            for role in topics:
                role_counts[role] = role_counts.get(role, 0) + 1
            primary_role = max(role_counts.items(), key=lambda x: x[1])[0]
        
        # Group similar greetings and closings
        unique_greetings = []
        for greeting in greetings:
            # Normalize greeting
            normalized = re.sub(r'[^a-z0-9\s]', '', greeting.lower())
            if not any(normalized in existing for existing in unique_greetings):
                unique_greetings.append(greeting)
        
        unique_closings = []
        for closing in closings:
            # Normalize closing
            normalized = re.sub(r'[^a-z0-9\s]', '', closing.lower())
            if not any(normalized in existing for existing in unique_closings):
                unique_closings.append(closing)
        
        # Limit to most common
        unique_greetings = unique_greetings[:5]
        unique_closings = unique_closings[:5]
        common_phrases = common_phrases[:10]
        
        # Return analysis results
        return {
            "formality_level": formality_level,
            "greeting_patterns": unique_greetings,
            "closing_patterns": unique_closings,
            "common_phrases": common_phrases,
            "dominant_language": dominant_language,
            "primary_role": primary_role
        }
    except Exception as e:
        logger.error(f"Error analyzing writing style: {str(e)}")
        return None

@app.route('/generate-reply', methods=['POST', 'OPTIONS'])
def generate_reply_endpoint():
    """Generate an AI reply for an email using the user's writing style."""
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Extract token from Authorization header
        access_token = extract_token(request)
        if not access_token:
            return jsonify({"error": "Missing or invalid authorization token"}), 401
            
        data = request.json
        email_id = data.get('emailId')
        
        if not email_id:
            return jsonify({"error": "Email ID is required"}), 400
        
        # Use token to authenticate with Gmail
        service = authenticate_gmail_with_token(access_token)
        
        # Get the email content
        email_data = get_email_content(service, email_id)
        
        if not email_data:
            return jsonify({"error": "Could not retrieve email"}), 404
        
        # Extract sender's name for personalization
        sender_name = extract_sender_name(email_data)
        logger.info(f"Extracted sender name: '{sender_name}'")
        
        # Always analyze writing style from sent emails
        logger.info("Fetching sent emails for style analysis")
        results = service.users().messages().list(userId="me", labelIds=["SENT"], maxResults=30).execute()
        messages = results.get("messages", [])
        
        # Initialize variables for personalized reply generation
        style_analysis = None
        reply_text = None
        
        if messages:
            # Get content of sent emails for style analysis
            sent_emails = []
            for msg in messages[:30]:  # Limit to 30 for performance
                sent_data = get_email_content(service, msg["id"])
                if sent_data:
                    sent_emails.append(sent_data)
            
            # Analyze writing style if we have sent emails
            if sent_emails:
                style_analysis = analyze_writing_style(sent_emails)
                logger.info(f"Style analysis completed: {style_analysis}")
                
                if style_analysis:
                    # Create a prompt with writing style analysis
                    sender_info = f"Sender name: {sender_name}" if sender_name else "Sender name: Unknown"
                    
                    # In the generate_reply_endpoint function, replace the prompt with:
                    prompt = f"""
                    Based on the following email:

                    Subject: {email_data.get('subject', '(No subject)')}
                    From: {email_data.get('from', '(Unknown sender)')}
                    {sender_info}
                    Message: {truncate_text(email_data.get('body', ''))}

                    Generate a reply that matches the following writing style:

                    Formality level: {style_analysis.get('formality_level', 'balanced')}
                    Typical greeting style: {', '.join(style_analysis.get('greeting_patterns', ['Hello'])[:2])}
                    Typical closing style: {', '.join(style_analysis.get('closing_patterns', ['Regards'])[:2])}
                    Common phrases I use: {', '.join(style_analysis.get('common_phrases', [])[:3])}
                    Primary communication context: {style_analysis.get('primary_role', 'general')}

                    Write in {style_analysis.get('dominant_language', 'English')} unless the email is clearly in another language.
                    Be concise and clear.
                    Use my typical greeting and closing style.

                    IMPORTANT INSTRUCTIONS:
                    1. Generate ONLY plain text without ANY HTML tags
                    2. Address the email to the actual sender by name if appropriate
                    3. If using a greeting with a name, make sure to use "{sender_name}" as the recipient's name, not a generic placeholder
                    4. Do not include any formatting, styling, or HTML tags in your response
                    5. Use only plain text with standard line breaks
                    6. Use proper capitalization (capitalize first words of sentences, proper nouns, the word "I", and beginnings of lines)
                    7. Write in a casual, natural human tone - avoid overly formulaic or AI-sounding phrases
                    8. Skip the "thank you for your email" opening unless truly warranted
                    9. Be direct and personal - write like a real human having a conversation
                    10. Vary your greeting styles, don't always use the same formula
                    11. Avoid excessive politeness or corporate-sounding language
                    """

                    
                    # Generate personalized reply using OpenAI
                    response = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": "You are an assistant helping write email replies in the user's personal style."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.7,
                        max_tokens=800
                    )
                    
                    reply_text = response.choices[0].message.content.strip()
        
        # Fall back to standard reply generation if personalized fails
        if not reply_text:
            logger.warning("No personalized reply generated, falling back to default template")
            # Include sender name in the fallback generation
            modified_body = email_data.get("body", "")
            if sender_name:
                modified_body = f"Email from {sender_name}:\n\n{modified_body}"
            reply_text = generate_reply(modified_body, style_analysis)
        
        if not reply_text:
            return jsonify({"error": "Failed to generate reply"}), 500
        
        # Create a draft in Gmail
        message = MIMEMultipart()
        message["to"] = email_data["from"]
        message["from"] = "me"
        message["subject"] = "Re: " + email_data["subject"]
        
        # Add reply text as email body
        msg = MIMEText(reply_text)
        message.attach(msg)
        
        # Create draft
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {'message': {'raw': raw}}
        draft = service.users().drafts().create(userId="me", body=body).execute() 
        
        # Return response with style analysis if available
        response_data = {
            "success": True,
            "reply": reply_text,
            "draftId": draft["id"],
            "senderName": sender_name or None  # Include extracted name in response
        }
        
        if style_analysis:
            response_data["styleAnalysis"] = style_analysis
            
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error generating reply: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_credentials_file():
    """Create credentials.json file from environment variable if it doesn't exist."""
    if os.path.exists("credentials.json"):
        return "credentials.json"
    
    # Check if we have credentials in environment variable
    credentials_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    if credentials_json:
        try:
            # Create a temporary file
            fd, temp_path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, 'w') as temp:
                temp.write(credentials_json)
            return temp_path
        except Exception as e:
            logger.error(f"Error creating credentials file from environment: {str(e)}")
    
    # If no credentials.json exists and no env var, try using individual env vars
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    
    if client_id and client_secret:
        try:
            credentials_data = {
                "web": {
                    "client_id": client_id,
                    "project_id": "ckvgzbldvyjizkfgqige",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_secret": client_secret
                }
            }
            
            # Create a temporary file
            fd, temp_path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, 'w') as temp:
                json.dump(credentials_data, temp)
            return temp_path
        except Exception as e:
            logger.error(f"Error creating credentials file from individual env vars: {str(e)}")
    
    return None

def authenticate_gmail_with_token(access_token):
    """Authenticate to Gmail API using an OAuth access token."""
    try:
        from google.oauth2.credentials import Credentials
        import os
        import pickle
        import json
        import hashlib
        
        # Get credentials file path
        credentials_file = get_credentials_file()
        if not credentials_file:
            raise Exception("No credentials available - check GOOGLE_CREDENTIALS_JSON environment variable")
        
        # Load client secrets from credentials file
        with open(credentials_file, "r") as creds_file:
            creds_data = json.load(creds_file)
            
        client_id = creds_data["web"]["client_id"]
        client_secret = creds_data["web"]["client_secret"]
        token_uri = creds_data["web"]["token_uri"]
        
        logger.info(f"Creating credentials with client_id: {client_id}")
        
        # Try to create credentials with the access token
        creds = Credentials(
            token=access_token,
            client_id=client_id,
            client_secret=client_secret,
            token_uri=token_uri,
            scopes=SCOPES
        )
        
        # Test the token and get user information
        try:
            logger.info("Testing access token with Gmail API")
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            user_email = profile.get('emailAddress', 'unknown')
            
            logger.info(f"Successfully identified user: {user_email}")
            
            # Look for stored refresh token for this user
            token_cache_dir = "token_cache"
            if not os.path.exists(token_cache_dir):
                os.makedirs(token_cache_dir)
            
            # Create email hash for storage
            email_hash = hashlib.md5(user_email.encode()).hexdigest()
            
            # Try to find a refresh token for this user
            found_refresh_token = None
            
            for filename in os.listdir(token_cache_dir):
                if filename.startswith("user_") or filename.startswith("token_"):
                    file_path = os.path.join(token_cache_dir, filename)
                    try:
                        with open(file_path, 'rb') as f:
                            stored_creds = pickle.load(f)
                            if hasattr(stored_creds, 'refresh_token') and stored_creds.refresh_token:
                                # Check if this token belongs to our user
                                try:
                                    temp_service = build("gmail", "v1", credentials=stored_creds)
                                    temp_profile = temp_service.users().getProfile(userId="me").execute()
                                    temp_email = temp_profile.get('emailAddress', '')
                                    
                                    if temp_email == user_email:
                                        found_refresh_token = stored_creds.refresh_token
                                        logger.info(f"Found refresh token for {user_email} in {filename}")
                                        break
                                except Exception as e:
                                    logger.warning(f"Failed to test stored token: {str(e)}")
                                    # This token didn't work, continue searching
                                    pass
                    except Exception as e:
                        logger.warning(f"Failed to read token file {filename}: {str(e)}")
                        # Couldn't read this file, skip it
                        pass
            
            # Create new credentials with the refresh token if found
            if found_refresh_token:
                # Create new credentials with the refresh token
                creds = Credentials(
                    token=access_token,
                    refresh_token=found_refresh_token,
                    client_id=client_id,
                    client_secret=client_secret,
                    token_uri=token_uri,
                    scopes=SCOPES
                )
                
                # Save these updated credentials
                user_token_file = os.path.join(token_cache_dir, f"user_{email_hash}.pickle")
                with open(user_token_file, "wb") as f:
                    pickle.dump(creds, f)
                    
                logger.info(f"Saved credentials with refresh token for {user_email}")
            else:
                # No refresh token found, but the current token works
                # Save it anyway for reference
                user_token_file = os.path.join(token_cache_dir, f"user_{email_hash}.pickle")
                with open(user_token_file, "wb") as f:
                    pickle.dump(creds, f)
                logger.warning(f"No refresh token found for {user_email}, saving current credentials")
                
            # Return service with the best credentials we have
            return build("gmail", "v1", credentials=creds)
            
        except Exception as e:
            logger.error(f"Error using access token: {str(e)}")
            raise Exception(f"Gmail API access error: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error authenticating with token: {str(e)}")
        raise Exception(f"Authentication failed: {str(e)}")
        
# Update the get-emails route to handle pagination
@app.route('/get-emails', methods=['GET', 'OPTIONS'])
def get_emails():
    """Get emails from Gmail."""
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Extract token from Authorization header
        access_token = extract_token(request)
        if not access_token:
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        
        # Use token to authenticate with Gmail
        service = authenticate_gmail_with_token(access_token)
        
        # Get pagination parameters
        # Remove specific label to fetch ALL emails instead of just INBOX
        max_results = int(request.args.get('maxResults', 20))
        page_token = request.args.get('pageToken')
        
        # Fetch messages with optional page token
        if page_token:
            results = service.users().messages().list(
                userId="me", 
                maxResults=max_results,  # Removed labelIds parameter to get all emails
                pageToken=page_token
            ).execute()
        else:
            results = service.users().messages().list(
                userId="me", 
                maxResults=max_results  # Removed labelIds parameter to get all emails
            ).execute()
        
        messages = results.get("messages", [])
        next_page_token = results.get("nextPageToken")
        
        if not messages:
            return jsonify({"emails": [], "nextPageToken": None})
        
        # Get basic info for each email
        emails = []
        for msg in messages:
            email_data = get_email_content(service, msg["id"])
            if email_data:
                # Include only necessary fields for the list view
                emails.append({
                    "id": email_data["id"],
                    "from": email_data["from"],
                    "subject": email_data["subject"],
                    "date": email_data["date"],
                    "snippet": email_data.get("snippet", "")
                })
        
        return jsonify({
            "emails": emails, 
            "nextPageToken": next_page_token
        })
        
    except Exception as e:
        logger.error(f"Error getting emails: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
@app.route('/get-sent-emails', methods=['GET', 'OPTIONS'])
def get_sent_emails():
    """Get sent emails from Gmail."""
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Extract token from Authorization header
        access_token = extract_token(request)
        if not access_token:
            return jsonify({"error": "Missing or invalid authorization token"}), 401
        
        # Use token to authenticate with Gmail
        service = authenticate_gmail_with_token(access_token)
        
        # Fetch sent emails
        max_results = int(request.args.get('maxResults', 50))
        
        # Fetch messages from sent folder
        results = service.users().messages().list(userId="me", labelIds=["SENT"], maxResults=max_results).execute()
        messages = results.get("messages", [])
        
        if not messages:
            return jsonify({"emails": []})
        
        # Get full content for each email
        emails = []
        for msg in messages:
            email_data = get_email_content(service, msg["id"])
            if email_data:
                emails.append(email_data)
        
        return jsonify({"emails": emails})
        
    except Exception as e:
        logger.error(f"Error getting sent emails: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get-email-detail', methods=['GET', 'OPTIONS'])
def get_email_detail():
    """Get detailed content of a specific email."""
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Extract token from Authorization header
        access_token = extract_token(request)
        if not access_token:
            return jsonify({"error": "Missing or invalid authorization token"}), 401
            
        email_id = request.args.get('id')
        
        if not email_id:
            return jsonify({"error": "Email ID is required"}), 400
        
        # Use token to authenticate with Gmail
        service = authenticate_gmail_with_token(access_token)
        
        # Get the full email content
        email_data = get_email_content(service, email_id)
        
        if not email_data:
            return jsonify({"error": "Could not retrieve email"}), 404
        
        return jsonify({"email": email_data})
        
    except Exception as e:
        logger.error(f"Error getting email detail: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
@app.route('/auth/logout', methods=['POST'])
def logout():
    """Clear server-side token cache for a user."""
    try:
        # Extract token from Authorization header
        access_token = extract_token(request)
        if not access_token:
            return jsonify({"error": "Missing or invalid authorization token"}), 401
            
        # Try to get the user's email from the token
        try:
            from google.oauth2.credentials import Credentials
            
            creds = Credentials(
                token=access_token,
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET,
                token_uri="https://oauth2.googleapis.com/token",
                scopes=SCOPES
            )
            
            # Create service and get user profile
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            user_email = profile.get('emailAddress', 'unknown')
            
            # Delete the token file for this user
            import hashlib
            token_key = f"{access_token}:{user_email}"
            token_hash = hashlib.md5(token_key.encode()).hexdigest()
            
            token_cache_dir = "token_cache"
            token_file = os.path.join(token_cache_dir, f"token_{token_hash}.pickle")
            
            if os.path.exists(token_file):
                os.remove(token_file)
                logger.info(f"Deleted token cache for user: {user_email}")
                
            return jsonify({"message": "Successfully logged out"}), 200
            
        except Exception as e:
            logger.error(f"Error during token cleanup: {str(e)}")
            
            # If we can't get the user email, try to clean up all tokens with this access_token
            # This is less precise but helps in error cases
            token_cache_dir = "token_cache"
            if os.path.exists(token_cache_dir):
                for filename in os.listdir(token_cache_dir):
                    if filename.startswith("token_"):
                        try:
                            file_path = os.path.join(token_cache_dir, filename)
                            with open(file_path, 'rb') as f:
                                stored_creds = pickle.load(f)
                                if stored_creds.token == access_token:
                                    os.remove(file_path)
                                    logger.info(f"Deleted token cache file: {filename}")
                        except Exception:
                            pass
            
            return jsonify({"message": "Logged out with token cleanup issues"}), 200
            
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/auth/verify-token', methods=['GET'])
def verify_token():
    """Verify a token and return the associated user info."""
    try:
        # Extract token from Authorization header
        access_token = extract_token(request)
        if not access_token:
            return jsonify({"error": "Missing or invalid authorization token"}), 401
            
        # Try to get the user's email from the token
        try:
            from google.oauth2.credentials import Credentials
            
            creds = Credentials(
                token=access_token,
                client_id=os.environ.get("GOOGLE_CLIENT_ID"),
                client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
                token_uri="https://oauth2.googleapis.com/token",
                scopes=SCOPES
            )
            
            # Create service and get user profile
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            user_email = profile.get('emailAddress', 'unknown')
            
            return jsonify({
                "valid": True,
                "email": user_email
            }), 200
                
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return jsonify({
                "valid": False,
                "error": str(e)
            }), 401
            
    except Exception as e:
        logger.error(f"Error during token verification: {str(e)}")
        return jsonify({"error": str(e)}), 500
# Route to serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        logger.info(f"Serving index.html for path: {path}")
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    # Make sure the server addresses all interfaces
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))