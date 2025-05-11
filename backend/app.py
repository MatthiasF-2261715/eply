from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

from config import logger
from routes import register_routes

def create_app():
    app = Flask(__name__, static_folder='../frontend/dist')
    CORS(app, resources={r"/*": {
        "origins": "*", 
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "OPTIONS"]
    }})
    
    # Register routes
    register_routes(app)
    
    return app

app = create_app()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))