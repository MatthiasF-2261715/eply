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
  'vraag',
  'hoeveel verdien ik per uur',
  'wat zijn de werktijden',
  'hoe werkt het sollicitatieproces',
  'kan ik morgen werken',
  'hoe meld ik mij aan',
  'wat zijn de voorwaarden',
  'hoe kan ik contact opnemen',
  'hoe werkt het bij jullie',
  'kan ik meer informatie krijgen',
  'hoe ziet een werkdag eruit',
  'hoe word ik uitbetaald',
  'hoe kan ik mij inschrijven',
  'hoeveel krijg ik betaald',
  'hoe werkt het rooster',
  'kan ik mijn beschikbaarheid doorgeven',
  'hoe werkt het systeem',
  'hoe kan ik mijn gegevens aanpassen',
  'hoe werkt het met vakantiedagen',
  'hoe kan ik feedback geven',
  'hoe werkt het onboardingproces'
];

spamExamples.forEach(t => classifier.addDocument(t, 'spam'));
hamExamples.forEach(t => classifier.addDocument(t, 'ham'));
classifier.train();

function isNoReplyAddress(email) {
  const noReplyPatterns = [
    /^no[.-]?reply@/i,
    /^do[.-]?not[.-]?reply@/i,
    /^noreply@/i,
    /^automated@/i,
    /^system@/i,
    /^notifications?@/i,
    /^info@/i,
    /^support@/i
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

function calculateSpamScore(content, emailAddress) {
  if (!content || typeof content !== 'string') return 0;

  let score = 0;
  const lc = content.toLowerCase();

  // Zeer sterke indicatoren (elk +30 punten)
  const strongIndicators = [
    /unsubscribe here/i,
    /click to unsubscribe/i,
    /nieuwsbrief uitschrijven/i,
    /afmelden voor deze e-mail/i
  ];
  if (strongIndicators.some(pattern => pattern.test(content))) score += 30;

  // Verificatiecodes (alleen als het bijna het hele bericht is)
  const codePattern = /\b(your|je|uw)?\s*(verification|verificatie|security)?\s*code\s*(is|:)?\s*\d{4,8}\b/i;
  if (codePattern.test(content) && content.length < 300) score += 30;

  // Veel links (alleen als er meer dan 5 zijn)
  const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
  if (linkCount > 5) score += 20;
  if (linkCount > 10) score += 20;

  // Marketing taal (lichte indicatie)
  const marketingPhrases = [
    'limited time offer',
    'act now',
    'buy now',
    'shop now',
    'bestel nu',
    'tijdelijke aanbieding',
    'koop nu'
  ];
  const marketingCount = marketingPhrases.filter(phrase => lc.includes(phrase)).length;
  if (marketingCount >= 2) score += 15;

  // "Do not reply" expliciete vermelding
  if (/do not reply to this (email|e-mail|message)/i.test(content)) score += 25;
  if (/niet beantwoorden|antwoord niet op deze/i.test(content)) score += 25;

  // Automated message headers
  if (/this is an automated (message|email|e-mail)/i.test(content)) score += 20;
  if (/dit is een geautomatiseerd bericht/i.test(content)) score += 20;

  // Betalingsbevestigingen
  if (/payment (confirmed|received|processed)/i.test(content) && content.length < 500) score += 15;
  if (/betaling (ontvangen|bevestigd|verwerkt)/i.test(content) && content.length < 500) score += 15;

  // Email adres boost
  if (isNoReplyAddress(emailAddress)) score += 25;

  return score;
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
    const spamScore = calculateSpamScore(emailContent, emailAddress);
    
    // Alleen blokkeren als score hoger dan 40 is (duidelijke spam/automated)
    const threshold = 40;
    const isValid = spamScore < threshold;

    // Log voor debugging
    console.log(`Email validation - Score: ${spamScore}, Valid: ${isValid}, From: ${emailAddress}`);

    return isValid;
  } catch (error) {
    console.error('Email validation error:', error);
    // Bij twijfel, accepteer de email
    return true;
  }
}

module.exports = { validateEmail };
