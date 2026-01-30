from __future__ import annotations

import json
from pathlib import Path

from rich.console import Console
from rich.table import Table

from .cases import TestSuite
from .client import McpClient

console = Console()


def print_results(suite: TestSuite):
    table = Table(title="Test Results", show_header=False, box=None, padding=(0, 1))
    table.add_column("status", width=2)
    table.add_column("name")

    for r in suite.results:
        icon = "[green]✓[/green]" if r.passed else "[red]✗[/red]"
        name = r.name if r.passed else f"[red]{r.name}[/red]"
        table.add_row(icon, name)

        if r.error:
            table.add_row("", f"[dim red]{r.error[:60]}[/dim red]")

    console.print(table)
    color = "green" if suite.failed == 0 else "red"
    console.print(
        f"\n[{color}]{suite.passed}/{suite.passed + suite.failed} passed[/{color}]"
    )


def print_schema(client: McpClient):
    schema = client.call("get_schema")
    table = Table(title="Schema", box=None)
    table.add_column("Table", style="cyan")
    table.add_column("Columns", style="dim")

    for t in schema:
        cols = ", ".join(c["name"] for c in t["columns"])
        table.add_row(t["name"], cols)

    console.print(table)


def print_samples(client: McpClient):
    # Classes
    classes = client.call("query", table="game.classes", order_by="id")
    t = Table(title="Classes", box=None)
    t.add_column("id", style="dim")
    t.add_column("name", style="cyan")
    t.add_column("spell_class_set", style="dim")

    for c in classes:
        t.add_row(str(c["id"]), c["name"], str(c["spell_class_set"]))

    console.print(t)
    console.print()

    # Spells sample
    spells = client.call(
        "query",
        table="game.spells",
        filters=[{"column": "is_passive", "op": "eq", "value": False}],
        limit=8,
    )

    t = Table(title="Spells (sample)", box=None)
    t.add_column("id", style="dim")
    t.add_column("name", style="cyan")
    t.add_column("cast", style="dim")
    t.add_column("school", style="dim")

    for s in spells:
        t.add_row(str(s["id"]), s["name"], str(s["cast_time"]), str(s["school_mask"]))

    console.print(t)
    console.print()

    # Items sample
    items = client.call(
        "query",
        table="game.items",
        filters=[{"column": "item_level", "op": "gte", "value": 630}],
        limit=8,
    )
    t = Table(title="Items (ilvl >= 630)", box=None)
    t.add_column("id", style="dim")
    t.add_column("name", style="cyan")
    t.add_column("ilvl", style="dim")
    t.add_column("quality", style="dim")

    for i in items:
        t.add_row(str(i["id"]), i["name"], str(i["item_level"]), str(i["quality"]))

    console.print(t)


def dump_data(client: McpClient, out_dir: Path):
    out_dir.mkdir(exist_ok=True)
    queries = [
        ("schema", lambda: client.call("get_schema")),
        ("classes", lambda: client.call("query", table="game.classes", order_by="id")),
        (
            "specs",
            lambda: client.call("query", table="game.specs", order_by="class_id"),
        ),
        ("spells_sample", lambda: client.call("query", table="game.spells", limit=100)),
        ("items_sample", lambda: client.call("query", table="game.items", limit=100)),
        ("auras_sample", lambda: client.call("query", table="game.auras", limit=100)),
    ]

    for name, fn in queries:
        path = out_dir / f"{name}.json"
        data = fn()
        path.write_text(json.dumps(data, indent=2))
        console.print(f"[dim]wrote {path}[/dim]")


def print_json(suite: TestSuite):
    print(
        json.dumps(
            {
                "passed": suite.passed,
                "failed": suite.failed,
                "results": [
                    {"name": r.name, "passed": r.passed, "error": r.error}
                    for r in suite.results
                ],
            }
        )
    )
