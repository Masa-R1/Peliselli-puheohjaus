from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel
from typing import Anyöö

class MCPServer:
    def __init__(self):
        self.server = Server("peliselli-mcp-server")
        self._register_tools()
    
    def _register_tools(self):
        # Register your tools here
        self.server.add_tool(
            name="change_light_color",
            description="Change light color in Home Assistant",
            inputSchema={
                "type": "object",
                "properties": {
                    "color": {
                        "type": "string",
                        "description": "Color to change to (e.g., red, blue, green)"
                    }
                },
                "required": ["color"]
            }
        )
    
    async def handle_tool_call(self, name: str, arguments: dict) -> str:
        if name == "change_light_color":
            return await self.change_light_color(arguments["color"])
        raise ValueError(f"Unknown tool: {name}")
    
    async def change_light_color(self, color: str) -> str:
        # Your implementation
        return f"Changed light color to {color}"

mcp_server = MCPServer()