import os
import json
import tempfile
import base64
import re
from config import logger

def extract_token(request):
    """Extract bearer token from request headers."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
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
    from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
    
    if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
        try:
            credentials_data = {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "project_id": "ckvgzbldvyjizkfgqige",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_secret": GOOGLE_CLIENT_SECRET
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
