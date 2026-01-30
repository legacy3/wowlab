from __future__ import annotations

import json
from typing import Any

import requests

DEFAULT_URL = "http://localhost:8080/mcp"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


class McpClient:
    def __init__(self, base_url: str = DEFAULT_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.headers = HEADERS.copy()

    def init(self) -> bool:
        try:
            r = self.session.post(
                self.base_url,
                headers=self.headers,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": "test", "version": "1.0"},
                    },
                },
            )
            self.headers["mcp-session-id"] = r.headers.get("mcp-session-id")
            self.session.post(
                self.base_url,
                headers=self.headers,
                json={"jsonrpc": "2.0", "method": "notifications/initialized"},
            )
            return True
        except Exception:
            return False

    def call(self, tool: str, **args: Any) -> Any:
        r = self.session.post(
            self.base_url,
            headers=self.headers,
            json={
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": tool, "arguments": args},
            },
        )
        for line in r.text.split("\n"):
            if line.startswith("data: {"):
                data = json.loads(line[6:])
                if "result" in data:
                    text = data["result"]["content"][0]["text"]
                    try:
                        return json.loads(text)
                    except json.JSONDecodeError:
                        return text
                if "error" in data:
                    raise Exception(data["error"]["message"])
        return None
