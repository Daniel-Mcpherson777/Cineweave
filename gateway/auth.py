import jwt
import httpx
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from functools import lru_cache
from config import get_settings

security = HTTPBearer()
settings = get_settings()


class JWKSCache:
    """Cache JWKS keys to avoid fetching on every request"""

    def __init__(self):
        self._keys = None
        self._last_fetch = 0
        self._cache_duration = 300  # 5 minutes

    async def get_keys(self):
        import time
        current_time = time.time()

        if self._keys is None or (current_time - self._last_fetch) > self._cache_duration:
            async with httpx.AsyncClient() as client:
                response = await client.get(settings.clerk_jwks_url)
                response.raise_for_status()
                jwks_data = response.json()
                self._keys = {key['kid']: key for key in jwks_data['keys']}
                self._last_fetch = current_time

        return self._keys


jwks_cache = JWKSCache()


async def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verify Clerk JWT token and return the payload.

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        # Get JWKS keys
        keys = await jwks_cache.get_keys()

        # Decode header to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')

        if kid not in keys:
            raise HTTPException(status_code=401, detail="Invalid token: unknown key ID")

        # Get the public key
        jwk = keys[kid]

        # Convert JWK to PEM
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)

        # Verify and decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=None,  # Clerk doesn't use aud claim by default
            issuer=settings.clerk_issuer,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
            }
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


def get_user_id_from_token(payload: dict) -> str:
    """Extract Clerk user ID from JWT payload"""
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
    return user_id
