import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Gmail API scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", 
         "https://www.googleapis.com/auth/gmail.modify", 
         "https://www.googleapis.com/auth/gmail.compose"]

# Google OAuth credentials
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")