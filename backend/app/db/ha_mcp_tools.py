import os
from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient

load_dotenv()

HA_BASE_URL = os.getenv("HA_BASE_URL")
HA_ACCESS_TOKEN = os.getenv("HA_ACCESS_TOKEN")

async def get_tools():
    client = MultiServerMCPClient(
        {
            "home_assistant": {
                "url": HA_BASE_URL + "/api/mcp",
                "transport": "streamable_http",
                "headers": {
                    "Authorization": "Bearer " + HA_ACCESS_TOKEN,
                },
            }
        }
    )
    
    tools = await client.get_tools()

    return tools