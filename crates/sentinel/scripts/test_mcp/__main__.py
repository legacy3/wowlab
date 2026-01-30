#!/usr/bin/env python3
"""
Test MCP server endpoints.

Usage:
    python -m test_mcp [--url URL] [--json] [--dump]
"""

from __future__ import annotations

import argparse
import warnings

warnings.filterwarnings("ignore")

import sys
from pathlib import Path

from .cases import run_tests
from .client import DEFAULT_URL, McpClient
from .output import (
    console,
    dump_data,
    print_json,
    print_results,
    print_samples,
    print_schema,
)


def main():
    parser = argparse.ArgumentParser(description="Test MCP server")
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--json", action="store_true", help="JSON output for CI")
    parser.add_argument(
        "--dump", action="store_true", help="Dump sample data to ./out/"
    )
    args = parser.parse_args()

    client = McpClient(args.url)
    if not args.json:
        console.print(f"[dim]Connecting to {args.url}...[/dim]")
    if not client.init():
        console.print("[red]Failed to connect[/red]")
        sys.exit(1)

    suite = run_tests(client)

    if args.json:
        print_json(suite)
    else:
        print_results(suite)
        console.print()
        print_schema(client)
        console.print()
        print_samples(client)
        if args.dump:
            console.print()
            dump_data(client, Path("out"))

    sys.exit(0 if suite.failed == 0 else 1)


if __name__ == "__main__":
    main()
