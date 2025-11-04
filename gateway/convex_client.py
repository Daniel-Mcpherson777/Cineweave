import httpx
from typing import Optional, Any, Dict
from config import get_settings

settings = get_settings()


class ConvexClient:
    """Client for interacting with Convex backend"""

    def __init__(self):
        self.base_url = settings.convex_url
        self.admin_key = settings.convex_admin_key

    async def query(self, function_name: str, args: Optional[Dict[str, Any]] = None) -> Any:
        """Execute a Convex query"""
        url = f"{self.base_url}/api/query"

        payload = {
            "path": function_name,
            "args": args or {},
            "format": "json",
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Convex {self.admin_key}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise Exception(f"Convex query error: {data['error']}")

            return data.get("value")

    async def mutation(self, function_name: str, args: Optional[Dict[str, Any]] = None) -> Any:
        """Execute a Convex mutation"""
        url = f"{self.base_url}/api/mutation"

        payload = {
            "path": function_name,
            "args": args or {},
            "format": "json",
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Convex {self.admin_key}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise Exception(f"Convex mutation error: {data['error']}")

            return data.get("value")


# Singleton instance
convex_client = ConvexClient()
