import os
from openai import OpenAI, OpenAIError

from dotenv import load_dotenv
load_dotenv()

client = OpenAI()

try:
    assistant = client.beta.assistants.create(
    name="E-mail Assistent",
    instructions=(
        "Je bent een e-mailassistent die inkomende e-mails automatisch beantwoordt door een conceptantwoord op te stellen. "
        "Je taak is om, op basis van de inhoud en toon van de inkomende e-mail, een zo relevant, professioneel en bruikbaar mogelijk antwoord te genereren.\n\n"
        "Je antwoord mag nog bewerkt worden door een menselijke gebruiker, dus het hoeft niet definitief te zijn — maar het moet zo volledig mogelijk zijn om de gebruiker tijd te besparen.\n\n"
        "Hou rekening met de volgende richtlijnen:\n"
        "- Begrijp de intentie van de afzender (bv. aanvraag, klacht, offerte-aanvaarding, vraag om info, enz.).\n"
        "- Reageer gepast qua toon: vriendelijk, professioneel en to-the-point.\n"
        "- Stel indien nodig variabelen of suggesties voor die de gebruiker eenvoudig kan aanpassen (bijvoorbeeld: “We kunnen u deze dienst aanbieden voor €[bedrag] excl. btw.”).\n"
        "- Laat ruimte voor specifieke keuzes of bevestigingen, bijvoorbeeld bij offertes, beschikbaarheden of vervolgstappen.\n"
        "- Voeg waar relevant extra informatie toe die de afzender zou kunnen helpen (zoals veelgestelde vragen, verwachte leveringstermijnen, voorwaarden, etc.).\n"
        "- Zet placeholders waar menselijke input nodig is, bv.: [bedrag invullen], [datum bevestigen], [naam klant], [bijlage toevoegen].\n\n"
        "Je output moet enkel de voorgestelde e-mail bevatten, in vloeiend Nederlands, klaar om gekopieerd of aangepast te worden.\n\n"
        "Start nu met het genereren van een voorstelantwoord op elke binnenkomende e-mail die je ontvangt."
    ),
    tools=[{"type": "code_interpreter"}],
    model="gpt-4o",
)

    thread = client.beta.threads.create()

    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=(
            "Dag Matthias,\n\n"
            "Ik hoorde van Peter Quax dat jouw poster nog ontbreekt. Bezorg je die nog even? Hou je ons ook op de hoogte van wat er nog verder gebeurd met je vakantiewerk? "
            "Spring bijvoorbeeld aan het begin van volgend academiejaar eens binnen om verslag te doen of stuur een mailtje.\n\n"
            "Mvg,\nFrank"
        )
    )

    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread.id,
        assistant_id=assistant.id,
        instructions=(
            "Je bent Matthias, UHasselt student en afgestudeerde bachelor in Informatica. "
            "Stel een professioneel, vriendelijk en bruikbaar conceptantwoord op deze e-mail op, klaar om gekopieerd of aangepast te worden."
        )
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