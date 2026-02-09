from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from typing import Union

class EncryptionService:
    def __init__(self, password: str = None):
        """
        Initialize the encryption service.
        If no password is provided, it will try to get it from environment variables.
        """
        if password is None:
            password = os.getenv("ENCRYPTION_PASSWORD")

        if password is None:
            raise ValueError("Encryption password not provided")

        self.password = password.encode()
        self.salt = os.getenv("ENCRYPTION_SALT", "default_salt_for_demo").encode()
        self.key = self._generate_key()
        self.cipher_suite = Fernet(self.key)

    def _generate_key(self) -> bytes:
        """Generate a key for encryption/decryption using PBKDF2 with the password and salt."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.password))
        return key

    def encrypt_data(self, data: Union[str, bytes]) -> str:
        """
        Encrypt the provided data.

        Args:
            data: The data to encrypt (string or bytes)

        Returns:
            The encrypted data as a base64-encoded string
        """
        if isinstance(data, str):
            data = data.encode()

        encrypted_data = self.cipher_suite.encrypt(data)
        return base64.urlsafe_b64encode(encrypted_data).decode()

    def decrypt_data(self, encrypted_data: Union[str, bytes]) -> str:
        """
        Decrypt the provided encrypted data.

        Args:
            encrypted_data: The encrypted data to decrypt (base64-encoded string or bytes)

        Returns:
            The decrypted data as a string
        """
        if isinstance(encrypted_data, str):
            encrypted_data = base64.urlsafe_b64decode(encrypted_data.encode())

        decrypted_data = self.cipher_suite.decrypt(encrypted_data)
        return decrypted_data.decode()

    def encrypt_health_data(self, health_data: dict) -> str:
        """
        Encrypt health-related user data.

        Args:
            health_data: Dictionary containing health-related information

        Returns:
            The encrypted health data as a base64-encoded string
        """
        import json
        health_data_str = json.dumps(health_data)
        return self.encrypt_data(health_data_str)

    def decrypt_health_data(self, encrypted_health_data: str) -> dict:
        """
        Decrypt health-related user data.

        Args:
            encrypted_health_data: The encrypted health data as a base64-encoded string

        Returns:
            The decrypted health data as a dictionary
        """
        import json
        decrypted_str = self.decrypt_data(encrypted_health_data)
        return json.loads(decrypted_str)


# Example usage:
# encryption_service = EncryptionService(password="your_secure_password_here")
#
# # Encrypt health data
# health_info = {
#     "allergies": ["nuts", "dairy"],
#     "conditions": ["diabetes"],
#     "medications": ["metformin"]
# }
# encrypted = encryption_service.encrypt_health_data(health_info)
# print(f"Encrypted: {encrypted}")
#
# # Decrypt health data
# decrypted = encryption_service.decrypt_health_data(encrypted)
# print(f"Decrypted: {decrypted}")