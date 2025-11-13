"""
Pattern: Decorator (Structural)
Dynamically adds validation and compression behavior to image upload
"""
from abc import ABC, abstractmethod
from typing import BinaryIO
from PIL import Image
import io
from app.database import DatabaseManager


class ImageUploader(ABC):
    """
    Pattern: Decorator (Structural)
    Component interface for image uploading
    """
    
    @abstractmethod
    async def upload(self, file: BinaryIO, filename: str, bucket: str) -> str:
        """Upload image and return public URL"""
        pass


class BaseImageUploader(ImageUploader):
    """
    Pattern: Decorator (Structural) - Concrete Component
    Base implementation with core upload functionality
    """
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def upload(self, file: BinaryIO, filename: str, bucket: str = "food-images") -> str:
        file.seek(0)
        file_content = file.read()
        file.seek(0)
        
        self.db.admin_client.storage.from_(bucket).upload(
            filename,
            file_content,
            {"content-type": "image/jpeg", "upsert": "true"}
        )
        
        public_url = self.db.admin_client.storage.from_(bucket).get_public_url(filename)
        return public_url


class ImageUploaderDecorator(ImageUploader):
    """
    Pattern: Decorator (Structural) - Base Decorator
    Maintains reference to component and delegates to it
    """
    
    def __init__(self, uploader: ImageUploader):
        self._uploader = uploader
    
    async def upload(self, file: BinaryIO, filename: str, bucket: str) -> str:
        return await self._uploader.upload(file, filename, bucket)


class ImageValidationDecorator(ImageUploaderDecorator):
    """
    Pattern: Decorator (Structural) - Concrete Decorator
    Adds validation logic before upload
    """
    
    MAX_SIZE_MB = 10
    ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}
    
    async def upload(self, file: BinaryIO, filename: str, bucket: str) -> str:
        file.seek(0)
        image = Image.open(file)
        
        if image.format not in self.ALLOWED_FORMATS:
            raise ValueError(f"Invalid format. Allowed: {', '.join(self.ALLOWED_FORMATS)}")
        
        file.seek(0, 2)
        size_mb = file.tell() / (1024 * 1024)
        file.seek(0)
        
        if size_mb > self.MAX_SIZE_MB:
            raise ValueError(f"Image too large. Max size: {self.MAX_SIZE_MB}MB")
        
        return await self._uploader.upload(file, filename, bucket)


class ImageCompressionDecorator(ImageUploaderDecorator):
    """
    Pattern: Decorator (Structural) - Concrete Decorator
    Adds compression logic before upload
    """
    
    MAX_WIDTH = 1920
    MAX_HEIGHT = 1080
    QUALITY = 85
    
    async def upload(self, file: BinaryIO, filename: str, bucket: str) -> str:
        file.seek(0)
        image = Image.open(file)
        
        if image.mode in ("RGBA", "LA", "P"):
            image = image.convert("RGB")
        
        if image.width > self.MAX_WIDTH or image.height > self.MAX_HEIGHT:
            image.thumbnail((self.MAX_WIDTH, self.MAX_HEIGHT), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=self.QUALITY, optimize=True)
        output.seek(0)
        
        return await self._uploader.upload(output, filename, bucket)


class ImageUploadService:
    """
    Pattern: Decorator (Structural)
    Service that composes decorators in desired order
    """
    
    def __init__(self, db: DatabaseManager):
        base_uploader = BaseImageUploader(db)
        compressed_uploader = ImageCompressionDecorator(base_uploader)
        self.uploader = ImageValidationDecorator(compressed_uploader)
    
    async def upload_image(self, file: BinaryIO, filename: str) -> str:
        return await self.uploader.upload(file, filename, "food-images")


def get_image_service(db: DatabaseManager) -> ImageUploadService:
    """
    Pattern: Factory (Creational)
    Creates image upload service with decorated uploader
    """
    return ImageUploadService(db)
