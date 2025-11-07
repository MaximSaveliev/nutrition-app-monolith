# Main API entry point for Vercel Python runtime
import sys
import os

# Get the absolute path to the project root
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, '..', 'backend')
sys.path.insert(0, backend_dir)

# Now import the FastAPI app
from app.main import app

# Export for Vercel
app = app