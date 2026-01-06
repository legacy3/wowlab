#!/usr/bin/env python3
"""
Profile the engine simulation and identify performance hotspots.

Usage:
    ./scripts/profile.py [iterations] [--json] [--top N]

Examples:
    ./scripts/profile.py 5000           # Profile 5000 iterations
    ./scripts/profile.py 10000 --json   # JSON output for programmatic use
    ./scripts/profile.py 3000 --top 30  # Show top 30 functions

Requirements:
    - cargo (Rust toolchain)
    - samply (cargo install samply)
    - addr2line, c++filt (usually pre-installed on Linux)

On Linux, you may need to run once:
    echo 1 | sudo tee /proc/sys/kernel/perf_event_paranoid
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import shutil
import subprocess
import sys
import time
from collections import Counter
from dataclasses import dataclass, asdict
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
ENGINE_DIR = SCRIPT_DIR.parent
BINARY = ENGINE_DIR / "../target/bench-profile/engine"
PROFILE_PATH = Path("/tmp/engine-profile.json.gz")

# ─────────────────────────────────────────────────────────────────────────────
# Data
# ─────────────────────────────────────────────────────────────────────────────


@dataclass
class Function:
    name: str
    module: str
    self_pct: float
    total_pct: float
    samples: int


@dataclass
class ProfileResult:
    iterations: int
    duration_sec: float
    throughput: float
    mean_dps: float
    samples: int
    functions: list[Function]
    modules: dict[str, float]
    # Computed summaries
    rhai_pct: float = 0.0
    alloc_pct: float = 0.0
    engine_pct: float = 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def run(cmd: list, **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def log(msg: str, quiet: bool = False):
    if not quiet:
        print(msg, flush=True)


def find_tool(*names: str) -> str | None:
    for name in names:
        if path := shutil.which(name):
            return path
    return None


def check_tools() -> bool:
    missing = []
    if not find_tool("cargo"):
        missing.append("cargo (https://rustup.rs)")
    if not find_tool("samply"):
        missing.append("samply (cargo install samply)")
    if missing:
        print("Missing required tools:", file=sys.stderr)
        for m in missing:
            print(f"  - {m}", file=sys.stderr)
        return False
    return True


def parse_module(name: str) -> str:
    """Extract module from Rust symbol: 'crate::mod::func' -> 'crate::mod'"""
    parts = name.split("::")
    # Remove hash suffix like h6f15b9ed2e446930
    if len(parts) >= 2 and parts[-1].startswith("h") and len(parts[-1]) == 17:
        parts = parts[:-1]
    return "::".join(parts[:-1]) if len(parts) > 1 else name


# ─────────────────────────────────────────────────────────────────────────────
# Symbol Resolution (batched)
# ─────────────────────────────────────────────────────────────────────────────


def resolve_symbol_macos(addr: str, binary: Path) -> str | None:
    """Resolve a single address using atos (macOS)."""
    # macOS binaries have a base address of 0x100000000
    full_addr = hex(0x100000000 + int(addr, 16))
    result = run(["atos", "-o", str(binary), full_addr])
    sym = result.stdout.strip()
    if not sym or sym.startswith("0x"):
        return None
    if " (in " in sym:
        func, rest = sym.split(" (in ", 1)
        loc = rest.split(") ", 1)[-1] if ") " in rest else ""
        return f"{func} {loc}".strip()
    return sym


def resolve_symbol_gnu(addr: str, binary: Path) -> str | None:
    """Resolve a single address using addr2line (Linux)."""
    addr2line = find_tool("addr2line", "gaddr2line")
    cxxfilt = find_tool("c++filt", "gc++filt")
    if not addr2line:
        return None
    result = run([addr2line, "-f", "-e", str(binary), addr])
    mangled = result.stdout.split("\n")[0]
    if cxxfilt:
        result = run([cxxfilt, mangled])
        return result.stdout.strip() or mangled
    return mangled


def resolve_symbols(addrs: list[str], binary: Path, quiet: bool) -> dict[str, str]:
    """Resolve addresses to symbols."""
    cache = {a: a for a in addrs if not a.startswith("0x")}
    hex_addrs = [a for a in addrs if a.startswith("0x")]

    if not hex_addrs:
        return cache

    resolver = resolve_symbol_macos if sys.platform == "darwin" else resolve_symbol_gnu

    log(f"  Resolving {len(hex_addrs)} addresses...", quiet)
    for addr in hex_addrs:
        resolved = resolver(addr, binary)
        cache[addr] = resolved if resolved else addr

    return cache


# ─────────────────────────────────────────────────────────────────────────────
# Profile Analysis
# ─────────────────────────────────────────────────────────────────────────────


def analyze(
    iterations: int, sim_json: str, duration: float, top_n: int, quiet: bool
) -> ProfileResult:
    log("  Loading profile...", quiet)
    with gzip.open(PROFILE_PATH, "rt") as f:
        data = json.load(f)

    # Find thread with most samples
    threads = [t for t in data.get("threads", []) if t.get("name") != "samply"]
    thread = max(threads, key=lambda t: len(t["samples"]["stack"]))

    strings = thread["stringArray"]
    func_names = thread["funcTable"]["name"]
    frame_funcs = thread["frameTable"]["func"]
    stack_frames = thread["stackTable"]["frame"]
    stack_prefixes = thread["stackTable"]["prefix"]
    stacks = thread["samples"]["stack"]
    weights = thread["samples"].get("weight", [1] * len(stacks))

    log(f"  {len(stacks)} samples, {len(strings)} symbols", quiet)

    # Resolve symbols
    log("  Resolving symbols...", quiet)
    symbols = resolve_symbols(strings, BINARY, quiet)

    # Count samples
    log("  Counting...", quiet)
    self_counts: Counter[str] = Counter()
    total_counts: Counter[str] = Counter()

    for i, stack_idx in enumerate(stacks):
        if stack_idx is None:
            continue
        weight, is_leaf, curr, seen = weights[i], True, stack_idx, set()
        while curr is not None and curr not in seen:
            seen.add(curr)
            if curr >= len(stack_frames):
                break
            frame_idx = stack_frames[curr]
            if frame_idx >= len(frame_funcs):
                break
            func_idx = frame_funcs[frame_idx]
            if func_idx >= len(func_names):
                break
            name_idx = func_names[func_idx]
            func = (
                symbols.get(strings[name_idx], strings[name_idx])
                if name_idx < len(strings)
                else "?"
            )
            total_counts[func] += weight
            if is_leaf:
                self_counts[func] += weight
                is_leaf = False
            curr = stack_prefixes[curr] if curr < len(stack_prefixes) else None

    total_weight = sum(weights)

    # Build results
    functions = []
    module_self: Counter[str] = Counter()

    for name, self_cnt in self_counts.most_common():
        module = parse_module(name)
        self_pct = self_cnt * 100.0 / total_weight
        total_pct = total_counts[name] * 100.0 / total_weight
        module_self[module] += self_pct

        # Skip stdlib noise
        if any(module.startswith(p) for p in ["std::", "core::", "alloc::", "_", "?"]):
            continue

        functions.append(
            Function(
                name=name,
                module=module,
                self_pct=round(self_pct, 2),
                total_pct=round(total_pct, 2),
                samples=self_cnt,
            )
        )

    modules = {m: round(p, 2) for m, p in module_self.most_common(15) if p >= 0.5}

    # Parse sim JSON
    try:
        sim = json.loads(sim_json)
        mean_dps = sim.get("mean_dps", 0)
    except:
        mean_dps = 0

    # Compute category breakdowns
    rhai_pct = sum(p for m, p in modules.items() if "rhai" in m.lower())
    alloc_pct = sum(
        p
        for m, p in modules.items()
        if any(
            x in m.lower() for x in ["arc", "drop", "clone", "alloc", "vec", "btree"]
        )
    )
    engine_pct = sum(p for m, p in modules.items() if "engine" in m.lower())

    return ProfileResult(
        iterations=iterations,
        duration_sec=round(duration, 2),
        throughput=round(iterations / duration, 1) if duration > 0 else 0,
        mean_dps=round(mean_dps, 0),
        samples=len(stacks),
        functions=functions[:top_n],
        modules=modules,
        rhai_pct=round(rhai_pct, 1),
        alloc_pct=round(alloc_pct, 1),
        engine_pct=round(engine_pct, 1),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Output
# ─────────────────────────────────────────────────────────────────────────────


def print_result(r: ProfileResult):
    W = 80
    print(f"\n{'=' * W}")
    print("ENGINE PROFILE RESULTS")
    print("=" * W)

    print(
        f"""
  Iterations:  {r.iterations:,}
  Duration:    {r.duration_sec:.1f}s
  Throughput:  {r.throughput:.0f} sims/sec
  Mean DPS:    {r.mean_dps:.0f}
  Samples:     {r.samples:,}
"""
    )

    print("-" * W)
    print("TIME BREAKDOWN BY CATEGORY")
    print("-" * W)
    print(f"  Rhai (scripting):     {r.rhai_pct:5.1f}%")
    print(f"  Memory (alloc/drop):  {r.alloc_pct:5.1f}%")
    print(f"  Engine code:          {r.engine_pct:5.1f}%")
    print()

    print("-" * W)
    print("HOT MODULES (by self time)")
    print("-" * W)
    for mod, pct in r.modules.items():
        bar = "#" * int(pct) + "." * (30 - int(pct))
        mod_short = (mod[:45] + "...") if len(mod) > 48 else mod
        print(f"  {pct:5.1f}%  {bar[:30]}  {mod_short}")
    print()

    print("-" * W)
    print("HOT FUNCTIONS (excluding std/core/alloc)")
    print("-" * W)
    print(f"  {'Self':>5}  {'Total':>5}  {'Samples':>7}  Function")
    print(f"  {'-'*5}  {'-'*5}  {'-'*7}  {'-'*55}")
    for f in r.functions:
        name = (f.name[:55] + "...") if len(f.name) > 58 else f.name
        print(f"  {f.self_pct:5.1f}  {f.total_pct:5.1f}  {f.samples:7}  {name}")
    print()

    # Top hotspots summary
    print("=" * W)
    print("TOP HOTSPOTS")
    print("=" * W)
    for i, f in enumerate(r.functions[:10], 1):
        print(f"  {i:2}. [{f.self_pct:5.2f}%] {f.name[:65]}")
    print()


def print_json(r: ProfileResult):
    out = asdict(r)
    out["functions"] = [asdict(f) for f in r.functions]
    print(json.dumps(out, indent=2))


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="Profile engine simulation",
        epilog="Requires: cargo, samply. Run with --help for more info.",
    )
    parser.add_argument("iterations", type=int, nargs="?", default=5000)
    parser.add_argument("--json", action="store_true", help="JSON output")
    parser.add_argument("--top", type=int, default=25, help="Top N functions")
    args = parser.parse_args()
    quiet = args.json

    if not check_tools():
        sys.exit(1)

    os.chdir(ENGINE_DIR)

    # Build with bench-profile (no LTO, has debug symbols)
    log("Building with bench-profile (debug symbols, no LTO)...", quiet)
    result = subprocess.run(
        ["cargo", "build", "--profile", "bench-profile"],
        capture_output=quiet,
    )
    if result.returncode != 0:
        print("Build failed", file=sys.stderr)
        sys.exit(1)

    # Profile
    log(f"Profiling {args.iterations} iterations (single-threaded)...", quiet)
    sim_cmd = [
        str(BINARY),
        "sim",
        "-s",
        "bm-hunter",
        "-i",
        str(args.iterations),
        "-d",
        "60",
        "--threads",
        "1",
        "-o",
        "json",
    ]

    start = time.time()
    result = subprocess.run(
        ["samply", "record", "-s", "-o", str(PROFILE_PATH)] + sim_cmd,
        capture_output=True,
        text=True,
    )
    duration = time.time() - start

    if result.returncode != 0:
        if "perf_event_paranoid" in result.stderr:
            print(
                "ERROR: Run: echo 1 | sudo tee /proc/sys/kernel/perf_event_paranoid",
                file=sys.stderr,
            )
        else:
            print(f"samply error: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    # Analyze
    log("Analyzing...", quiet)
    profile = analyze(args.iterations, result.stdout, duration, args.top, quiet)

    # Output
    if args.json:
        print_json(profile)
    else:
        print_result(profile)


if __name__ == "__main__":
    main()
