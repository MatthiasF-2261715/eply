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
        content: "Analyze if this email appears to be spam, automated, or a marketing message. Respond only with true (if it's spam/automated) or false (if it's a regular email that needs a response). If the email is a real calendar invite (Outlook, Google, etc.): Don't reply"
      }, {
        role: "user",
        content: emailContent
      }]
    });
    
    return completion.choices[0].message.content.toLowerCase() === 'true';
  } catch (error) {
    console.error('AI check error:', error);
    return false;
  }
}

async function validateEmail(emailAddress, emailContent) {
  if (isNoReplyAddress(emailAddress)) {
    return false;
  }

  try {
    const isSpam = await checkWithAI(emailContent);
    return !isSpam;
  } catch (error) {
    console.error('Email validation error:', error);
    return true;
  }
}

module.exports = { validateEmail };