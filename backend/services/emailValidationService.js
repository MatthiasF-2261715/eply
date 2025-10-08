const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

const spamExamples = [
  'unsubscribe',
  'click here',
  'limited time offer',
  'special offer',
  'sale',
  'discount',
  'buy now',
  'order confirmation',
  'your verification code is',
  'verification code',
  'use code',
  'do not reply',
  'this is an automated message',
  'system notification',
  'account verification',
  'nieuwsbrief',
  'promotie',
  'aanbieding',
  'automatische e-mail',
  'betaling is verwerkt',
  'wachtwoord reset',
  'reset je wachtwoord'
];

const hamExamples = [
  'kan je me helpen',
  'zijn we beschikbaar om te overleggen',
  'stukje feedback',
  'bijgevoegd document',
  'kun je dit reviewen',
  'vraag over factuur',
  'hoe gaat het',
  'groeten',
  'vriendelijke groeten',
  'bedankt voor je tijd',
  'afspraak',
  'vraag'
];

spamExamples.forEach(t => classifier.addDocument(t, 'spam'));
hamExamples.forEach(t => classifier.addDocument(t, 'ham'));
classifier.train();

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

function heuristicCheck(content) {
  if (!content || typeof content !== 'string') return false;

  const lc = content.toLowerCase();

  const codePattern = /\b(code|verification|verificatie|pin|otp)[^\n\r]{0,20}\b\d{4,8}\b/mi;
  if (codePattern.test(content)) return true;

  const autoIndicators = [
    'unsubscribe',
    'abmelden',
    'nieuwsbrief',
    'promotion',
    'promotie',
    'sale',
    'aanbieding',
    'limited time',
    'do not reply',
    'no-reply',
    'click here',
    'bestel',
    'order confirmation',
    'betalingsbewijs',
    'automated message',
    'this is an automated'
  ];
  if (autoIndicators.some(i => lc.includes(i))) return true;

  const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
  if (linkCount >= 3) return true;

  return false;
}

function classifyWithLocalModel(content) {
  if (!content || typeof content !== 'string') return false;
  const tokens = tokenizer.tokenize(content.toLowerCase()).slice(0, 200).join(' ');
  try {
    const label = classifier.classify(tokens);
    return label === 'spam';
  } catch (e) {
    console.error('Classifier error:', e);
    return false;
  }
}

async function checkWithAI(emailContent) {
  try {
    if (heuristicCheck(emailContent)) return true;
    return classifyWithLocalModel(emailContent);
  } catch (error) {
    console.error('Local check error:', error);
    return false;
  }
}

async function validateEmail(emailAddress, emailContent) {
  if (isNoReplyAddress(emailAddress)) {
    return false;
  }

  try {
    const isSpamOrAutomated = await checkWithAI(emailContent);
    return !isSpamOrAutomated;
  } catch (error) {
    console.error('Email validation error:', error);
    return true;
  }
}

module.exports = { validateEmail };
