import os
from dotenv import load_dotenv

load_dotenv()

HA_BASE_URL = os.getenv("HA_BASE_URL")
HA_ACCESS_TOKEN = os.getenv("HA_ACCESS_TOKEN")
MCP_SERVER_CONFIGS = {
    "home_assistant": {
        "url": f"{HA_BASE_URL}/api/mcp" if HA_BASE_URL else None,
        "transport": "streamable_http",
        "headers": {
            "Authorization": f"Bearer {HA_ACCESS_TOKEN}" if HA_ACCESS_TOKEN else None,
        },
    }
}

async def get_tools():
    if not HA_BASE_URL or not HA_ACCESS_TOKEN:
        return False

    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient
    except ModuleNotFoundError:
        return False

    client = MultiServerMCPClient(MCP_SERVER_CONFIGS)
    
    tools = await client.get_tools()

    return tools