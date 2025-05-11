import os
import pickle
import hashlib
import datetime
import json
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
import google.auth.transport.requests

from config import SCOPES, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, logger
from utils import get_credentials_file, extract_token

def authenticate_gmail():
    """Authenticate with OAuth 2.0 and return the Gmail API service."""
    creds = None

    # Get credentials file path
    credentials_file = get_credentials_file()
    if not credentials_file:
        raise Exception("No credentials available - check GOOGLE_CREDENTIALS_JSON environment variable")

    # Try to load saved credentials
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)

    # If no valid credentials, go through OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_file, SCOPES)
            creds = flow.run_local_server(port=8080)

        # Save credentials for future sessions
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)

    # Create the Gmail service
    service = build("gmail", "v1", credentials=creds)
    return service

def authenticate_gmail_with_token(access_token):
    """Authenticate to Gmail API using an OAuth access token."""
    try:
        # Get credentials file path
        credentials_file = get_credentials_file()
        if not credentials_file:
            raise Exception("No credentials available - check GOOGLE_CREDENTIALS_JSON environment variable")
        
        # Load client secrets from credentials file
        with open(credentials_file, "r") as creds_file:
            creds_data = json.load(creds_file)
            
        client_id = creds_data["web"]["client_id"]
        client_secret = creds_data["web"]["client_secret"]
        token_uri = creds_data["web"]["token_uri"]
        
        logger.info(f"Creating credentials with client_id: {client_id}")
        
        # Try to create credentials with the access token
        creds = Credentials(
            token=access_token,
            client_id=client_id,
            client_secret=client_secret,
            token_uri=token_uri,
            scopes=SCOPES
        )
        
        # Test the token and get user information
        try:
            logger.info("Testing access token with Gmail API")
            service = build("gmail", "v1", credentials=creds)
            profile = service.users().getProfile(userId="me").execute()
            user_email = profile.get('emailAddress', 'unknown')
            
            logger.info(f"Successfully identified user: {user_email}")
            
            # Look for stored refresh token for this user
            token_cache_dir = "token_cache"
            if not os.path.exists(token_cache_dir):
                os.makedirs(token_cache_dir)
            
            # Create email hash for storage
            email_hash = hashlib.md5(user_email.encode()).hexdigest()
            
            # Try to find a refresh token for this user
            found_refresh_token = None
            
            for filename in os.listdir(token_cache_dir):
                if filename.startswith("user_") or filename.startswith("token_"):
                    file_path = os.path.join(token_cache_dir, filename)
                    try:
                        with open(file_path, 'rb') as f:
                            stored_creds = pickle.load(f)
                            if hasattr(stored_creds, 'refresh_token') and stored_creds.refresh_token:
                                # Check if this token belongs to our user
                                try:
                                    temp_service = build("gmail", "v1", credentials=stored_creds)
                                    temp_profile = temp_service.users().getProfile(userId="me").execute()
                                    temp_email = temp_profile.get('emailAddress', '')
                                    
                                    if temp_email == user_email:
                                        found_refresh_token = stored_creds.refresh_token
                                        logger.info(f"Found refresh token for {user_email} in {filename}")
                                        break
                                except Exception as e:
                                    logger.warning(f"Failed to test stored token: {str(e)}")
                                    # This token didn't work, continue searching
                                    pass
                    except Exception as e:
                        logger.warning(f"Failed to read token file {filename}: {str(e)}")
                        # Couldn't read this file, skip it
                        pass
            
            # Create new credentials with the refresh token if found
            if found_refresh_token:
                # Create new credentials with the refresh token
                creds = Credentials(
                    token=access_token,
                    refresh_token=found_refresh_token,
                    client_id=client_id,
                    client_secret=client_secret,
                    token_uri=token_uri,
                    scopes=SCOPES
                )
                
                # Save these updated credentials
                user_token_file = os.path.join(token_cache_dir, f"user_{email_hash}.pickle")
                with open(user_token_file, "wb") as f:
                    pickle.dump(creds, f)
                    
                logger.info(f"Saved credentials with refresh token for {user_email}")
            else:
                # No refresh token found, but the current token works
                # Save it anyway for reference
                user_token_file = os.path.join(token_cache_dir, f"user_{email_hash}.pickle")
                with open(user_token_file, "wb") as f:
                    pickle.dump(creds, f)
                logger.warning(f"No refresh token found for {user_email}, saving current credentials")
                
            # Return service with the best credentials we have
            return build("gmail", "v1", credentials=creds)
            
        except Exception as e:
            logger.error(f"Error using access token: {str(e)}")
            raise Exception(f"Gmail API access error: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error authenticating with token: {str(e)}")
        raise Exception(f"Authentication failed: {str(e)}")