const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createAssistantIfNeeded() {
  try {
    // Check if the assistant already exists
    const existingAssistants = await openai.beta.assistants.list();
    const existingAssistant = existingAssistants.data.find(
      (assistant) => assistant.name === "E-mail Assistent"
    );
    if (existingAssistant) {
      return existingAssistant.id;
    }

    // Create a new assistant if not found
    const assistant = await openai.beta.assistants.create({
      name: "E-mail Assistent",
      instructions:
        "Je bent Matthias, UHasselt student en afgestudeerde bachelor in Informatica. " +
        "Je bent een e-mailassistent die inkomende e-mails automatisch beantwoordt door een professioneel, vriendelijk en bruikbaar conceptantwoord op te stellen, klaar om gekopieerd of aangepast te worden. " +
        "Gebruik alle beschikbare data uit de e-mail en context om zo volledig mogelijk te antwoorden. " +
        "Vermijd placeholders en vul alle informatie zo goed mogelijk in. " +
        "Begrijp de intentie van de afzender (bv. aanvraag, klacht, offerte-aanvaarding, vraag om info, enz.). " +
        "Reageer gepast qua toon: vriendelijk, professioneel en to-the-point. " +
        "Voeg waar relevant extra informatie toe die de afzender zou kunnen helpen (zoals veelgestelde vragen, verwachte leveringstermijnen, voorwaarden, etc.). " +
        "Je output moet enkel de voorgestelde e-mail bevatten, in vloeiend Nederlands.",
      tools: [{ type: "code_interpreter" }],
      model: "gpt-4o",
    });
    return assistant.id;
  } catch (error) {
    console.error("Error creating assistant:", error);
    return null;
  }
}

async function useAssistant(assistantId, emailContent) {
  try {
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: emailContent,
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

module.exports = { createAssistantIfNeeded, useAssistant };