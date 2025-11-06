import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Set environment variables if not set (for Vercel)
os.environ.setdefault("APP_ENV", "production")

try:
    from app.main import app
except Exception as e:
    print(f"Error importing app: {e}")
    # Create a minimal error handler
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    
    @app.get("/{path:path}")
    @app.post("/{path:path}")
    @app.put("/{path:path}")
    @app.delete("/{path:path}")
    async def catch_all(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Server initialization failed: {str(e)}",
                "path": path
            }
        )
