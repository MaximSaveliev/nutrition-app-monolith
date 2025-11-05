"""
Chain of Responsibility Pattern: Image processing pipeline
Processes images through a chain of handlers
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from PIL import Image
import io
import base64


class ImageHandler(ABC):
    """Abstract handler in the chain of responsibility"""
    
    def __init__(self):
        self._next_handler: Optional[ImageHandler] = None
    
    def set_next(self, handler: 'ImageHandler') -> 'ImageHandler':
        """Set the next handler in the chain"""
        self._next_handler = handler
        return handler
    
    def handle(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle the request and pass to next handler
        
        Args:
            image_data: Dict containing image data and metadata
            
        Returns:
            Processed image data
        """
        # Process in this handler
        image_data = self.process(image_data)
        
        # Pass to next handler if exists
        if self._next_handler:
            return self._next_handler.handle(image_data)
        
        return image_data
    
    @abstractmethod
    def process(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the image data in this handler"""
        pass


class ImageValidationHandler(ImageHandler):
    """Validates image format and size"""
    
    MAX_SIZE_MB = 10
    ALLOWED_FORMATS = ['JPEG', 'PNG', 'WEBP']
    
    def process(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate image"""
        print("[VALIDATION] Validating image...")
        
        try:
            # Decode base64 image
            image_base64 = image_data.get('base64', '')
            
            # Remove data URI prefix if present
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',')[1]
            
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Check format
            if image.format not in self.ALLOWED_FORMATS:
                raise ValueError(f"Invalid format: {image.format}. Allowed: {self.ALLOWED_FORMATS}")
            
            # Check size
            size_mb = len(image_bytes) / (1024 * 1024)
            if size_mb > self.MAX_SIZE_MB:
                raise ValueError(f"Image too large: {size_mb:.2f}MB. Max: {self.MAX_SIZE_MB}MB")
            
            # Store image object
            image_data['image'] = image
            image_data['format'] = image.format
            image_data['size_mb'] = size_mb
            image_data['dimensions'] = image.size
            image_data['validated'] = True
            
            print(f"[VALIDATION] ✓ Valid - Format: {image.format}, Size: {size_mb:.2f}MB, Dimensions: {image.size}")
            
        except Exception as e:
            image_data['validated'] = False
            image_data['error'] = str(e)
            print(f"[VALIDATION] ✗ Failed: {str(e)}")
            raise
        
        return image_data


class ImageResizeHandler(ImageHandler):
    """Resizes image to optimal dimensions"""
    
    MAX_WIDTH = 1024
    MAX_HEIGHT = 1024
    
    def process(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Resize image if needed"""
        print("[RESIZE] Checking if resize needed...")
        
        if not image_data.get('validated'):
            print("[RESIZE] Skipping - image not validated")
            return image_data
        
        try:
            image = image_data['image']
            width, height = image.size
            
            # Check if resize needed
            if width <= self.MAX_WIDTH and height <= self.MAX_HEIGHT:
                print(f"[RESIZE] No resize needed - dimensions OK")
                image_data['resized'] = False
                return image_data
            
            # Calculate new dimensions maintaining aspect ratio
            ratio = min(self.MAX_WIDTH / width, self.MAX_HEIGHT / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            # Resize image
            resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            image_data['image'] = resized_image
            image_data['original_dimensions'] = (width, height)
            image_data['dimensions'] = (new_width, new_height)
            image_data['resized'] = True
            
            print(f"[RESIZE] ✓ Resized from {width}x{height} to {new_width}x{new_height}")
            
        except Exception as e:
            print(f"[RESIZE] ✗ Error: {str(e)}")
            # Don't fail the chain, continue with original image
        
        return image_data


class ImageOptimizationHandler(ImageHandler):
    """Optimizes image quality and format"""
    
    QUALITY = 85
    
    def process(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize image"""
        print("[OPTIMIZE] Optimizing image...")
        
        if not image_data.get('validated'):
            print("[OPTIMIZE] Skipping - image not validated")
            return image_data
        
        try:
            image = image_data['image']
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            # Optimize and save to bytes
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=self.QUALITY, optimize=True)
            optimized_bytes = output.getvalue()
            
            # Encode to base64
            optimized_base64 = base64.b64encode(optimized_bytes).decode('utf-8')
            
            original_size = image_data.get('size_mb', 0)
            optimized_size = len(optimized_bytes) / (1024 * 1024)
            savings = ((original_size - optimized_size) / original_size * 100) if original_size > 0 else 0
            
            image_data['optimized_base64'] = optimized_base64
            image_data['optimized_size_mb'] = optimized_size
            image_data['optimization_savings_percent'] = savings
            image_data['optimized'] = True
            
            print(f"[OPTIMIZE] ✓ Optimized - Size: {optimized_size:.2f}MB (saved {savings:.1f}%)")
            
        except Exception as e:
            print(f"[OPTIMIZE] ✗ Error: {str(e)}")
            # Use original base64 if optimization fails
            image_data['optimized_base64'] = image_data.get('base64', '')
            image_data['optimized'] = False
        
        return image_data


class ImageProcessingPipeline:
    """
    Chain of Responsibility Pattern: Image Processing Pipeline
    Processes images through a chain of handlers
    """
    
    def __init__(self):
        """Initialize the processing pipeline"""
        # Create handlers
        validation = ImageValidationHandler()
        resize = ImageResizeHandler()
        optimization = ImageOptimizationHandler()
        
        # Build chain
        validation.set_next(resize).set_next(optimization)
        
        self._first_handler = validation
    
    def process_image(self, base64_image: str) -> Dict[str, Any]:
        """
        Process image through the pipeline
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            Dict with processed image data
        """
        print("\n=== Starting Image Processing Pipeline ===")
        
        image_data = {
            'base64': base64_image,
            'validated': False,
            'resized': False,
            'optimized': False
        }
        
        try:
            result = self._first_handler.handle(image_data)
            print("=== Image Processing Complete ===\n")
            return result
        except Exception as e:
            print(f"=== Image Processing Failed: {str(e)} ===\n")
            raise


# Global pipeline instance
image_pipeline = ImageProcessingPipeline()
