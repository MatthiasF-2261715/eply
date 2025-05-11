import re
from openai import OpenAI
from config import OPENAI_API_KEY, logger
from utils import truncate_text

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def generate_reply(email_body, style_analysis=None):
    """Generate AI-based reply to email based on received email and user's style."""
    try:
        # Clean up the email body - remove any quoted text or signatures
        cleaned_body = email_body
        
        # Find common signature markers and trim them
        signature_markers = ["--", "Best regards", "Kind regards", "Regards", "Thanks", "Thank you", 
                             "Met vriendelijke groet", "Vriendelijke groeten", "Groeten", "Bedankt", "Alvast bedankt", "MVG"]
        for marker in signature_markers:
            if marker in cleaned_body:
                parts = cleaned_body.split(marker, 1)
                cleaned_body = parts[0]
        
        # Remove any subject line that might appear at the beginning
        lines = cleaned_body.split('\n')
        if lines and (lines[0].startswith('Subject:') or lines[0].lower().startswith('re:') or ':' in lines[0][:30]):
            cleaned_body = '\n'.join(lines[1:])

        # Truncate the email body to avoid token limit issues
        truncated_body = truncate_text(cleaned_body)
        logger.debug(f"Original email length: {len(email_body)}, Cleaned length: {len(cleaned_body)}, Truncated length: {len(truncated_body)}")
        
        # Create system prompt based on style analysis
        system_prompt = "You are an assistant helping write email replies that match the user's writing style."
        user_prompt = f"Please write a professional and helpful reply to this email:\n\n{truncated_body}"
        
        if style_analysis:
            greeting_examples = ", ".join(style_analysis.get("greeting_patterns", [])[:3])
            closing_examples = ", ".join(style_analysis.get("closing_patterns", [])[:3])
            formality = style_analysis.get("formality_level", "balanced")
            phrases = ", ".join(style_analysis.get("common_phrases", [])[:5])
            
            system_prompt += f"\nThe user typically writes with a {formality} tone."
            if greeting_examples:
                system_prompt += f"\nThey often begin emails with: {greeting_examples}"
            if closing_examples:
                system_prompt += f"\nThey typically close with: {closing_examples}"
            if phrases:
                system_prompt += f"\nCommon phrases they use: {phrases}"
                
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
        
        return reply
        
    except Exception as e:
        logger.error(f"Error generating reply: {e}")
        raise e

def analyze_writing_style(sent_emails):
    """Analyze writing style patterns from sent emails."""
    try:
        if not sent_emails:
            return None
            
        # Extract email bodies
        email_bodies = [email.get('body', '') for email in sent_emails if email.get('body')]
        
        if not email_bodies:
            return None
            
        # Extract greeting and closing patterns
        greeting_patterns = []
        closing_patterns = []
        phrases = []
        
        for body in email_bodies:
            lines = body.strip().split('\n')
            # Skip empty emails
            if not lines:
                continue
                
            # Check first few lines for greetings
            for i in range(min(3, len(lines))):
                line = lines[i].strip()
                if line and len(line) < 60:
                    # Common greeting patterns
                    if re.search(r'^(Hi|Hello|Dear|Good|Hey|Greetings|Morning|Afternoon|Evening|Hallo|Beste|Dag|Goedemorgen|Goedemiddag|Goedenavond|Hoi)', line, re.IGNORECASE):
                        greeting_patterns.append(line)
                        break
            
            # Check last few lines for closings
            for i in range(max(0, len(lines)-5), len(lines)):
                line = lines[i].strip()
                if line and len(line) < 100:
                    # Common closing patterns
                    if re.search(r'^(Thanks|Thank you|Regards|Best|Sincerely|Cheers|Best regards|Kind regards|Warm regards|Met vriendelijke groet|Groeten|Bedankt|Alvast bedankt|MVG)', line, re.IGNORECASE):
                        closing_patterns.append(line)
        
        # Analyze formality and common phrases
        system_prompt = """
        You are an assistant that analyzes writing style. 
        Analyze the following email texts to determine:
        1. The overall formality level (formal, semi-formal, casual, or very casual)
        2. Common phrases or expressions the writer uses
        3. The primary communication context (business, academic, personal, customer service, etc.)
        4. The dominant language being used
        
        Format your response as a JSON object with these keys:
        - formality_level
        - common_phrases (list of phrases)
        - primary_role
        - dominant_language
        """
        
        # Join a subset of emails for analysis to avoid token limits
        email_sample = "\n---\n".join(email_bodies[:10])
        email_sample = truncate_text(email_sample, 4000)
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze these email texts:\n\n{email_sample}"}
            ],
            max_tokens=500,
            temperature=0.2
        )
        
        analysis_text = response.choices[0].message.content
        
        # Extract JSON from response if wrapped in backticks
        if "```json" in analysis_text:
            analysis_text = analysis_text.split("```json")[1].split("```")[0]
        elif "```" in analysis_text:
            analysis_text = analysis_text.split("```")[1].split("```")[0]
            
        try:
            import json
            analysis = json.loads(analysis_text)
        except json.JSONDecodeError:
            # Fallback for when the model doesn't return valid JSON
            analysis = {
                "formality_level": "balanced",
                "common_phrases": [],
                "primary_role": "general",
                "dominant_language": "English"
            }
        
        # Combine everything
        return {
            "greeting_patterns": list(set(greeting_patterns))[:5],
            "closing_patterns": list(set(closing_patterns))[:5],
            "formality_level": analysis.get("formality_level", "balanced"),
            "common_phrases": analysis.get("common_phrases", [])[:10],
            "primary_role": analysis.get("primary_role", "general"),
            "dominant_language": analysis.get("dominant_language", "English"),
            "sample_count": len(email_bodies)
        }
            
    except Exception as e:
        logger.error(f"Error analyzing writing style: {e}")
        return None