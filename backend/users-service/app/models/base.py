"""Base model class for all data models."""

from typing import Any

import uuid6


class Base:
    """Base class for all models providing common functionality."""
    
    @classmethod
    def generate_uuid(cls) -> str:
        """Generate a new UUID7.
        
        Returns:
            A string representation of UUID7.
        """
        return str(uuid6.uuid7())

    def __init__(self, **kwargs: Any) -> None:
        """Initialize the model with provided keyword arguments.
        
        Args:
            **kwargs: Arbitrary keyword arguments to set as attributes.
        """
        for key, value in kwargs.items():
            setattr(self, key, value)
