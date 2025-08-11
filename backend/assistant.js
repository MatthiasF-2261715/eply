const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function useAssistant(assistantId, currentEmail, previousEmails = []) {
  try {
    // Format the context with previous emails and current email
    const context = formatEmailContext(currentEmail, previousEmails);

    console.log('Formatted context for OpenAI:', context);
    
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    
    await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: context,
      }
    );
    
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });
    
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      for (const message of messages.data.reverse()) {
        if (message.role === "assistant") {
          return message.content[0].text.value;
        }
      }
    } else {
      return run.status;
    }
  } catch (e) {
    console.error('OpenAI API error:', e);
    return null;
  }
}

function decodeBase64(content) {
  try {
      return Buffer.from(content, 'base64').toString('utf-8');
  } catch (e) {
      console.error('Error decoding Base64 content:', e);
      return content; // Fallback to original content
  }
}

function formatEmailContext(currentEmail, previousEmails) {
  let context = "Previous email history:\n\n";
  
  // Filter and clean emails more aggressively
  const validEmails = previousEmails
    .map(email => ({
      ...email,
      cleanedContent: cleanAndValidateEmail(email.content)
    }))
    .filter(email => email.cleanedContent && email.cleanedContent.length > 20)
    .slice(-5); // Limit to last 5 valid emails
  
  validEmails.forEach((email, index) => {
      context += `Email ${index + 1}:\n`;
      context += `User writing style: ${email.cleanedContent}\n\n`;
  });
  
  context += "Current email to respond to:\n";
  context += `From: ${currentEmail.from}\n`;
  context += `Content: ${currentEmail.content}\n\n`;
  context += "Please draft a response that maintains consistency with my previous email style and context.";
  
  return context;
}

function cleanAndValidateEmail(content) {
  if (!content || typeof content !== 'string') return null;
  
  let cleaned = content;
  
  // Split content by newlines and try to decode each part that looks like base64
  const lines = content.split('\n');
  let decodedParts = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip very short lines
    if (trimmedLine.length < 20) continue;
    
    // Try to decode if it looks like base64
    if (isBase64(trimmedLine)) {
      try {
        const decoded = decodeBase64(trimmedLine);
        decodedParts.push(decoded);
      } catch (e) {
        // If decoding fails, skip this line
        continue;
      }
    } else {
      // If not base64, use as is
      decodedParts.push(trimmedLine);
    }
  }
  
  // Join all decoded parts
  cleaned = decodedParts.join('\n');
  
  // If we couldn't decode anything meaningful, try the original content
  if (!cleaned || cleaned.length < 10) {
    cleaned = content;
  }
  
  // Check for garbled content early
  if (isGarbledContent(cleaned)) {
    return null;
  }
  
  // Clean HTML content aggressively
  cleaned = stripHtmlAndClean(cleaned);
  
  // Final validation
  if (!isValidCleanedContent(cleaned)) {
    return null;
  }
  
  // Limit length
  if (cleaned.length > 800) {
    cleaned = cleaned.substring(0, 800) + '...';
  }
  
  return cleaned;
}

function isBase64(str) {
  // Basic checks
  if (!str || str.length < 20) return false;
  
  // Must be valid base64 pattern
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return false;
  
  // Length should be multiple of 4 for valid base64
  if (str.length % 4 !== 0) return false;
  
  // Try to decode and check if result is readable
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8');
    
    // Check if decoded text contains readable characters
    const readableChars = (decoded.match(/[a-zA-Z0-9\s.,!?;:()\-'"]/g) || []).length;
    const readableRatio = readableChars / decoded.length;
    
    // Must be at least 60% readable to be considered valid decoded text
    return readableRatio > 0.6;
  } catch (e) {
    return false;
  }
}

function isGarbledContent(content) {
  // Check for excessive non-ASCII characters
  const nonAsciiCount = (content.match(/[^\x00-\x7F]/g) || []).length;
  const ratio = nonAsciiCount / content.length;
  
  // Check for specific garbled patterns
  const hasGarbledChars = /[�����]{2,}/.test(content);
  const hasWeirdUnicode = /[\u0080-\u00FF]{10,}/.test(content);
  const hasControlChars = /[\x00-\x08\x0E-\x1F\x7F-\x9F]{3,}/.test(content);
  
  return ratio > 0.3 || hasGarbledChars || hasWeirdUnicode || hasControlChars;
}

function stripHtmlAndClean(content) {
  let cleaned = content;
  
  // Remove HTML tags and entities
  cleaned = cleaned
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z0-9#]+;/g, ' '); // Remove other HTML entities
  
  // Clean whitespace and formatting
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  
  return cleaned;
}

function isValidCleanedContent(content) {
  if (!content || content.length < 10) return false;
  
  // Check if it's mostly readable text
  const readableChars = (content.match(/[a-zA-Z0-9\s.,!?;:()\-'"]/g) || []).length;
  const readableRatio = readableChars / content.length;
  
  // Must be at least 70% readable characters
  if (readableRatio < 0.7) return false;
  
  // Check for reasonable word patterns
  const words = content.split(/\s+/).filter(word => /^[a-zA-Z0-9.,!?;:()\-'"]+$/.test(word));
  
  // Must have at least 3 recognizable words
  return words.length >= 3;
}

module.exports = { useAssistant };