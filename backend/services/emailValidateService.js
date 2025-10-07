const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isNoReplyAddress(email) {
  const noReplyPatterns = [
    /no[.-]?reply@/i,
    /do[.-]?not[.-]?reply@/i,
    /noreply@/i,
    /automated@/i,
    /system@/i,
    /notification@/i
  ];
  
  return noReplyPatterns.some(pattern => pattern.test(email));
}

async function checkWithAI(emailContent) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Analyze if this email appears to be spam, automated, or a marketing message. Consider factors like: promotional language, impersonal greetings, bulk mail indicators, generic content, etc. Return JSON with format: {\"isSpam\": boolean, \"reason\": string}"
      }, {
        role: "user",
        content: emailContent
      }],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('AI check error:', error);
    return { isSpam: false, reason: 'error-checking' };
  }
}

async function validateEmail(emailAddress, emailContent) {
  if (isNoReplyAddress(emailAddress)) {
    return {
      valid: false,
      reason: 'no-reply'
    };
  }

  try {
    const aiCheck = await checkWithAI(emailContent);

    if (aiCheck.isSpam) {
      return {
        valid: false,
        reason: 'automated',
        details: aiCheck.reason
      };
    }

    return {
      valid: true
    };
  } catch (error) {
    console.error('Email validation error:', error);
    return { valid: true };
  }
}

module.exports = { validateEmail };