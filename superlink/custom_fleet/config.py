"""Configuration for Custom Fleet Servicer."""

import os
from dataclasses import dataclass


@dataclass
class AccessControlConfig:
    """External Access Control Configuration."""
    
    # API endpoint for your external access control system
    api_endpoint: str
    
    # API key for authentication
    api_key: str
    
    # Request timeout in seconds
    timeout_seconds: int = 5
    
    # Number of retries on failure
    retry_count: int = 2
    
    # Fail-open (True) or fail-closed (False) on errors
    fail_open: bool = False
    
    @classmethod
    def from_env(cls) -> "AccessControlConfig":
        """Load configuration from environment variables."""
        return cls(
            api_endpoint=os.getenv(
                "EXTERNAL_ACL_API_ENDPOINT",
                "https://acl.yourcompany.com/api/v1"
            ),
            api_key=os.getenv("EXTERNAL_ACL_API_KEY", ""),
            timeout_seconds=int(os.getenv("EXTERNAL_ACL_TIMEOUT", "5")),
            retry_count=int(os.getenv("EXTERNAL_ACL_RETRY_COUNT", "2")),
            fail_open=os.getenv("EXTERNAL_ACL_FAIL_OPEN", "false").lower() == "true",
        )