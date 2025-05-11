import re
from openai import OpenAI
from config import OPENAI_API_KEY, logger
import utils

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