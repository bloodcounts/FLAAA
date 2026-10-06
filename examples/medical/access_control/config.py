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
    
    # Timeout in seconds for each HTTP attempt
    timeout_seconds: int = 5
    
    # Number of retries on failure
    retry_count: int = 2
    
    # Fail-open (True) or fail-closed (False) on errors
    fail_open: bool = False
    
    @classmethod
    def from_env(cls) -> "AccessControlConfig":
        """Load configuration from environment variables."""
        endpoint = os.getenv("EXTERNAL_ACL_API_ENDPOINT", "").strip()
        if not endpoint:
            raise ValueError(
                "EXTERNAL_ACL_API_ENDPOINT must be set when governance enforcement is enabled"
            )
        if not endpoint.startswith("https://"):
            raise ValueError("EXTERNAL_ACL_API_ENDPOINT must use HTTPS")
        return cls(
            api_endpoint=endpoint,
            api_key=os.getenv("EXTERNAL_ACL_API_KEY", ""),
            timeout_seconds=int(os.getenv("EXTERNAL_ACL_TIMEOUT", "5")),
            retry_count=int(os.getenv("EXTERNAL_ACL_RETRY_COUNT", "2")),
            fail_open=os.getenv("EXTERNAL_ACL_FAIL_OPEN", "false").lower() == "true",
        )
