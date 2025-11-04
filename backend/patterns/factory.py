"""
Factory Pattern: AI Provider Factory
Creates different AI provider instances based on configuration
"""
from abc import ABC, abstractmethod
from groq import Groq
from config import get_settings
from typing import Optional, List, Dict, Any
import base64
import json


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    def analyze_image(self, image_data: str, prompt: str) -> Dict[str, Any]:
        """Analyze an image and return results"""
        pass
    
    @abstractmethod
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        """Generate text based on prompt"""
        pass


class GroqAIProvider(AIProvider):
    """Groq AI Provider implementation"""
    
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        self.vision_model = "meta-llama/llama-4-maverick-17b-128e-instruct"
        self.text_model = "llama-3.3-70b-versatile"
    
    def analyze_image(self, image_data: str, prompt: str) -> Dict[str, Any]:
        """Analyze image using Groq Vision API"""
        try:
            # Prepare the image for Groq API
            if image_data.startswith('data:image'):
                # Remove data URI prefix if present
                image_data = image_data.split(',')[1]
            
            completion = self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                },
                            },
                        ],
                    }
                ],
                temperature=0.7,
                max_tokens=2048,
            )
            
            response_text = completion.choices[0].message.content
            
            # Try to parse JSON response
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                # If not JSON, return as text
                return {"raw_response": response_text}
                
        except Exception as e:
            raise Exception(f"Error analyzing image with Groq: {str(e)}")
    
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        """Generate text using Groq Text API"""
        try:
            messages = []
            if context:
                messages.append({"role": "system", "content": context})
            messages.append({"role": "user", "content": prompt})
            
            completion = self.client.chat.completions.create(
                model=self.text_model,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Error generating text with Groq: {str(e)}")


class AIProviderFactory:
    """
    Factory Pattern: Creates AI provider instances
    Allows easy switching between different AI providers
    """
    
    _providers: Dict[str, type] = {
        "groq": GroqAIProvider,
    }
    
    @staticmethod
    def create_provider(provider_type: str = "groq") -> AIProvider:
        """
        Create an AI provider instance
        
        Args:
            provider_type: Type of provider to create (default: groq)
            
        Returns:
            AIProvider instance
        """
        settings = get_settings()
        
        if provider_type not in AIProviderFactory._providers:
            raise ValueError(f"Unknown provider type: {provider_type}")
        
        provider_class = AIProviderFactory._providers[provider_type]
        
        if provider_type == "groq":
            return provider_class(settings.groq_api_key)
        
        raise ValueError(f"Provider {provider_type} not configured")
    
    @staticmethod
    def register_provider(name: str, provider_class: type):
        """Register a new AI provider type"""
        AIProviderFactory._providers[name] = provider_class
