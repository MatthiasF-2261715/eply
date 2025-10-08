const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function useAssistant(assistantId, currentEmail, previousEmails = []) {
  try {
    console.log("Start AI Assistant");
    const context = formatEmailContext(currentEmail, previousEmails);
    
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
    
    console.log("Stop AI assistant");
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

function formatEmailContext(currentEmail, previousEmails) {
  let context = "Previous email history:\n\n";

  const validEmails = previousEmails
    .map(email => ({
      ...email,
      content: email.content
    }))
    .filter(email => email.content && email.content.length > 20)
    .slice(-10); 

  validEmails.forEach((email, index) => {
      context += `Email ${index + 1}:\n`;
      context += `User writing style: ${email.content}\n\n`;
  });

  context += "Current email to respond to:\n";
  context += `From: ${currentEmail.from}\n`;
  context += `Content: ${currentEmail.content}\n\n`;
  context += "Please draft a response that maintains consistency with my previous email style and context.";

  return context;
}

module.exports = { useAssistant };