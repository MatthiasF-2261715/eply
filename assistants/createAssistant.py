import os
from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def create_assistant(dir_path="bestanden"):
    try:
        # Upload files first
        file_ids = []
        if os.path.isdir(dir_path):
            for filename in os.listdir(dir_path):
                if filename.endswith(('.txt', '.pdf', '.csv')):  # ondersteunde formaten
                    file_path = os.path.join(dir_path, filename)
                    with open(file_path, "rb") as file:
                        uploaded_file = client.files.create(
                            file=file,
                            purpose="assistants"
                        )
                        file_ids.append(uploaded_file.id)
                        print(f"File '{filename}' geüpload: {uploaded_file.id}")

        # Assistant aanmaken
        assistant = client.beta.assistants.create(
            name="E-mail Assistent",
            instructions=(
                "Je bent Mathia Palaia, CEO van Troom, een platform waar studenten kunnen bijverdienen als privéchauffeurs, en klanten op een flexibele manier een betrouwbare chauffeur kunnen boeken.\n\n"
                "Je taak is om professionele, vriendelijke en duidelijke e-mails te schrijven als antwoord op inkomende vragen. Dit kunnen zowel vragen zijn van:\n"
                "– studenten die voor Troom rijden (over betalingen, werkuren, praktische afspraken, enz.),\n"
                "– als van klanten of geïnteresseerden (over prijzen, ritten, samenwerkingen, enz.).\n\n"
                "Stijl en toon:\n"
                "Professioneel, maar niet afstandelijk\n"
                "Menselijk en toegankelijk, niet te formeel of kil\n"
                "Antwoord als een echte persoon, niet als een chatbot\n"
                "Toon empathie of begrip, als het past bij de vraag\n"
                "Gebruik heldere, natuurlijke zinnen – vermijd vakjargon of overdreven formele taal\n"
                "Houd het beknopt, maar informatief\n\n"
                "Richtlijnen:\n"
                "Geef altijd een direct en helder antwoord op de vraag\n"
                "Als iets niet zeker is, stel dan voor om er later op terug te komen of vraag extra info\n"
                "Voeg eventueel een extra tip of suggestie toe die nuttig kan zijn voor de ontvanger\n"
                "Sluit vriendelijk af, zoals een echte CEO met een persoonlijke touch\n"
                "Zeer belangrijk dat je niet teveel zevert en de BESTANDEN gebruikt om de FAQ vragen te beantwoorden\n"
                "Eindig altijd met vriendelijke groeten Mathia\n"
            ),
            tools=[{"type": "retrieval"}],  # verander code_interpreter naar retrieval
            model="gpt-4-1106-preview",  # nieuwer model met betere file support
            file_ids=file_ids  # gebruik file_ids ipv files
        )
        return assistant.id

    except OpenAIError as e:
        print(f"Error: {str(e)}")
        return None

def get_assistant_overview(assistant_id):
    try:
        # Get assistant details
        assistant = client.beta.assistants.retrieve(assistant_id)
        
        # Create overview
        overview = f"""
Assistant Overview:
------------------
Name: {assistant.name}
Model: {assistant.model}
Created: {assistant.created_at}

Instructions:
------------
{assistant.instructions}

"""
        return overview

    except OpenAIError as e:
        print(f"Error retrieving assistant details: {e}")
        return None        


assistant_id = create_assistant("bestanden")
print(f"Assistant ID: {assistant_id}")
print(get_assistant_overview(assistant_id) if assistant_id else "Failed to create assistant.")