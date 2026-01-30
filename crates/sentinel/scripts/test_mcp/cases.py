from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

from .client import McpClient


@dataclass
class TestCase:
    name: str
    tool: str
    args: dict[str, Any]
    check: Callable[[Any], bool]


@dataclass
class TestResult:
    name: str
    passed: bool
    error: str | None = None


@dataclass
class TestSuite:
    passed: int = 0
    failed: int = 0
    results: list[TestResult] = field(default_factory=list)


TESTS = [
    TestCase("schema", "get_schema", {}, lambda r: isinstance(r, list) and len(r) > 0),
    TestCase(
        "spell_by_id",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "id", "op": "eq", "value": 133}],
        },
        lambda r: isinstance(r, list)
        and len(r) == 1
        and r[0].get("name") == "Fireball",
    ),
    TestCase(
        "contains",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "Pyroblast"}],
            "limit": 5,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all("Pyroblast" in s["name"] for s in r),
    ),
    TestCase(
        "starts_with",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "starts_with", "value": "Chaos"}],
            "limit": 5,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(s["name"].startswith("Chaos") for s in r),
    ),
    TestCase(
        "gt",
        "query",
        {
            "table": "game.items",
            "filters": [{"column": "item_level", "op": "gt", "value": 635}],
            "limit": 3,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(i["item_level"] > 635 for i in r),
    ),
    TestCase(
        "gte",
        "query",
        {
            "table": "game.items",
            "filters": [{"column": "item_level", "op": "gte", "value": 636}],
            "limit": 3,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(i["item_level"] >= 636 for i in r),
    ),
    TestCase(
        "lt",
        "query",
        {
            "table": "game.items",
            "filters": [{"column": "item_level", "op": "lt", "value": 100}],
            "limit": 3,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(i["item_level"] < 100 for i in r),
    ),
    TestCase(
        "lte",
        "query",
        {
            "table": "game.items",
            "filters": [{"column": "item_level", "op": "lte", "value": 50}],
            "limit": 3,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(i["item_level"] <= 50 for i in r),
    ),
    TestCase(
        "ne",
        "query",
        {
            "table": "game.classes",
            "filters": [{"column": "id", "op": "ne", "value": 1}],
        },
        lambda r: isinstance(r, list) and all(c["id"] != 1 for c in r),
    ),
    TestCase(
        "bool_true",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "is_passive", "op": "eq", "value": True}],
            "limit": 3,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(s["is_passive"] is True for s in r),
    ),
    TestCase(
        "bool_false",
        "query",
        {
            "table": "game.auras",
            "filters": [{"column": "pandemic_refresh", "op": "eq", "value": False}],
            "limit": 3,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(a["pandemic_refresh"] is False for a in r),
    ),
    TestCase(
        "multi_filter",
        "query",
        {
            "table": "game.spells",
            "filters": [
                {"column": "is_passive", "op": "eq", "value": False},
                {"column": "school_mask", "op": "eq", "value": 4},
            ],
            "limit": 3,
        },
        lambda r: isinstance(r, list) and len(r) > 0,
    ),
    TestCase(
        "range",
        "query",
        {
            "table": "game.items",
            "filters": [
                {"column": "item_level", "op": "gte", "value": 630},
                {"column": "item_level", "op": "lte", "value": 640},
            ],
            "limit": 5,
        },
        lambda r: isinstance(r, list)
        and len(r) > 0
        and all(630 <= i["item_level"] <= 640 for i in r),
    ),
    TestCase(
        "order_asc",
        "query",
        {"table": "game.classes", "order_by": "spell_class_set"},
        lambda r: isinstance(r, list)
        and r == sorted(r, key=lambda x: x["spell_class_set"]),
    ),
    TestCase(
        "order_desc",
        "query",
        {"table": "game.classes", "order_by": "id", "order_desc": True},
        lambda r: isinstance(r, list)
        and r == sorted(r, key=lambda x: x["id"], reverse=True),
    ),
    TestCase(
        "limit",
        "query",
        {"table": "game.spells", "limit": 3},
        lambda r: isinstance(r, list) and len(r) == 3,
    ),
    TestCase(
        "offset",
        "query",
        {"table": "game.classes", "order_by": "id", "limit": 3, "offset": 2},
        lambda r: isinstance(r, list) and len(r) == 3 and r[0]["id"] not in [1, 2],
    ),
    TestCase(
        "table_spells",
        "query",
        {"table": "game.spells", "limit": 1},
        lambda r: isinstance(r, list) and "name" in r[0],
    ),
    TestCase(
        "table_items",
        "query",
        {"table": "game.items", "limit": 1},
        lambda r: isinstance(r, list) and "name" in r[0],
    ),
    TestCase(
        "table_auras",
        "query",
        {"table": "game.auras", "limit": 1},
        lambda r: isinstance(r, list) and "spell_id" in r[0],
    ),
    TestCase(
        "table_specs",
        "query",
        {"table": "game.specs", "limit": 1},
        lambda r: isinstance(r, list) and "name" in r[0],
    ),
    TestCase(
        "table_classes",
        "query",
        {"table": "game.classes", "limit": 1},
        lambda r: isinstance(r, list) and "name" in r[0],
    ),
    TestCase(
        "table_specs_traits",
        "query",
        {"table": "game.specs_traits", "limit": 1},
        lambda r: isinstance(r, list) and "spec_id" in r[0],
    ),
    TestCase(
        "special_%",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "%"}],
            "limit": 3,
        },
        lambda r: isinstance(r, list),
    ),
    TestCase(
        "special__",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "_"}],
            "limit": 3,
        },
        lambda r: isinstance(r, list),
    ),
    TestCase(
        "special_'",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "'"}],
            "limit": 3,
        },
        lambda r: isinstance(r, list),
    ),
    # Limit/offset edge cases
    TestCase(
        "limit_cap",
        "query",
        {"table": "game.spells", "limit": 2000},
        lambda r: isinstance(r, list) and len(r) <= 1000,
    ),
    TestCase(
        "large_offset",
        "query",
        {"table": "game.spells", "offset": 999999, "limit": 10},
        lambda r: r == "No results" or (isinstance(r, list) and len(r) == 0),
    ),
    TestCase(
        "empty_results",
        "query",
        {"table": "game.spells", "filters": [{"column": "id", "op": "eq", "value": -99999}]},
        lambda r: r == "No results",
    ),
    TestCase(
        "unicode_filter",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "\u4e2d\u6587\u7535\u5b50\u6e38\u620f"}],
            "limit": 3,
        },
        lambda r: isinstance(r, list) or r == "No results",
    ),
    TestCase(
        "sql_injection",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "'; DROP TABLE--"}],
        },
        lambda r: isinstance(r, list) or r == "No results",
    ),
    TestCase(
        "error_table",
        "query",
        {"table": "bad.table"},
        lambda r: r is None or "Unknown" in str(r),
    ),
    TestCase(
        "error_column",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "bad", "op": "eq", "value": 1}],
        },
        lambda r: r is None or "not filterable" in str(r),
    ),
    TestCase(
        "error_null_value",
        "query",
        {"table": "game.spells", "filters": [{"column": "id", "op": "eq", "value": None}]},
        lambda r: r is None or "requires a value" in str(r),
    ),
    TestCase(
        "error_type_mismatch",
        "query",
        {"table": "game.spells", "filters": [{"column": "id", "op": "eq", "value": "hello"}]},
        lambda r: r is None or "type mismatch" in str(r).lower(),
    ),
    TestCase(
        "error_order_by",
        "query",
        {"table": "game.spells", "order_by": "nonexistent"},
        lambda r: r is None or "not sortable" in str(r),
    ),
    TestCase(
        "error_contains_on_int",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "id", "op": "contains", "value": "123"}],
        },
        lambda r: r is None or "text" in str(r).lower() or "string" in str(r).lower(),
    ),
    TestCase(
        "float_filter",
        "query",
        {
            "table": "game.items",
            "filters": [{"column": "dmg_variance", "op": "gte", "value": 0.0}],
            "limit": 3,
        },
        lambda r: isinstance(r, list) and len(r) > 0,
    ),
    TestCase(
        "zero_limit",
        "query",
        {"table": "game.spells", "limit": 0},
        lambda r: r == "No results" or (isinstance(r, list) and len(r) == 0),
    ),
    TestCase(
        "empty_filters",
        "query",
        {"table": "game.classes", "filters": []},
        lambda r: isinstance(r, list) and len(r) > 0,
    ),
    TestCase(
        "case_sensitive_contains",
        "query",
        {
            "table": "game.spells",
            "filters": [{"column": "name", "op": "contains", "value": "fireball"}],
            "limit": 5,
        },
        lambda r: isinstance(r, list) or r == "No results",
    ),
]


def run_tests(client: McpClient) -> TestSuite:
    suite = TestSuite()

    for tc in TESTS:
        try:
            result = client.call(tc.tool, **tc.args)
            passed = tc.check(result)
        except Exception as e:
            passed = tc.name.startswith("error_") and tc.check(str(e))
            if not passed:
                suite.results.append(TestResult(tc.name, False, str(e)))
                suite.failed += 1
                continue

        suite.results.append(TestResult(tc.name, passed))
        suite.passed += passed
        suite.failed += not passed

    return suite
