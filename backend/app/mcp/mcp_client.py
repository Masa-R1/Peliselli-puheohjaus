import os
from dotenv import load_dotenv
import asyncio
from mcp.client.sse import sse_client
from mcp.client.session import ClientSession

load_dotenv()

HA_BASE_URL = os.getenv("HA_BASE_URL")
HA_ACCESS_TOKEN = os.getenv("HA_ACCESS_TOKEN")

async def main():
    async with sse_client(
        url=HA_BASE_URL + "/mcp_server/sse",
        headers={"Authorization": "Bearer " + HA_ACCESS_TOKEN}
    ) as (read, write):

        session = ClientSession(read, write)

        await session.initialize()

        tools = await session.list_tools()
        print(tools)

asyncio.run(main())
