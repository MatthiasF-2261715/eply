const spamassassin = require('spamassassin');
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

async function checkSpamScore(emailContent) {
  return new Promise((resolve, reject) => {
    spamassassin.score(emailContent, (error, score) => {
      if (error) return reject(error);
      // Typically emails with scores > 5 are considered spam
      resolve(score > 5);
    });
  });
}

async function checkWithAI(emailContent) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Analyze if this email is spam or automated. Return only 'true' for spam/automated or 'false' for legitimate personal email."
      }, {
        role: "user",
        content: emailContent
      }],
      max_tokens: 10
    });
    
    return completion.choices[0].message.content.trim().toLowerCase() === 'true';
  } catch (error) {
    console.error('AI spam check error:', error);
    return false;
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
    const [isSpam, isAutomated] = await Promise.all([
      checkSpamScore(emailContent),
      checkWithAI(emailContent)
    ]);

    if (isSpam || isAutomated) {
      return {
        valid: false,
        reason: isSpam ? 'spam' : 'automated'
      };
    }

    return {
      valid: true
    };
  } catch (error) {
    console.error('Email validation error:', error);
    // Bij twijfel laten we de email door
    return { valid: true };
  }
}

module.exports = { validateEmail };