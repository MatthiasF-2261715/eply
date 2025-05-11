import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import html
from config import logger

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
        
        # Handle HTML entities properly
        body = html.unescape(body)
        
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