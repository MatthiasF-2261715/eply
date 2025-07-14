import os
from openai import OpenAI, OpenAIError

from dotenv import load_dotenv
load_dotenv()

client = OpenAI()

try:
    assistant = client.beta.assistants.create(
        name="Math Tutor",
        instructions="You are a personal math tutor. Write and run code to answer math questions.",
        tools=[{"type": "code_interpreter"}],
        model="gpt-4o",
    )

    thread = client.beta.threads.create()

    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content="I need to solve the equation `3x + 11 = 14`. Can you help me?"
    )

    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread.id,
        assistant_id=assistant.id,
        instructions="Please address the user as Jane Doe. The user has a premium account."
    )

    if run.status == 'completed': 
        messages = client.beta.threads.messages.list(
            thread_id=thread.id
        )
        # Zoek het laatste assistant-bericht en print alleen de tekst
        for message in reversed(messages.data):
            if message.role == "assistant":
                # Print de tekst van het eerste content block
                print(message.content[0].text.value)
                break
    else:
        print(run.status)
        
except OpenAIError as e:
    print(f"OpenAI API error: {e}")