from flask import request, jsonify, send_from_directory
import os
import json
import pickle
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import hashlib
import datetime
from utils import truncate_text

from config import SCOPES, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, logger
from utils import extract_token, extract_sender_name, get_credentials_file
from auth import authenticate_gmail_with_token
from email_service import get_email_content
from ai_service import generate_reply, analyze_writing_style
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

def register_routes(app):
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