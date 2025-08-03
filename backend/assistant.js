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

function formatEmailContext(currentEmail, previousEmails) {
  let context = "Previous email history:\n\n";
  
  // Add last 10 previous emails to context
  previousEmails.slice(-10).forEach((email, index) => {
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