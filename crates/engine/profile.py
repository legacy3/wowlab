#!/usr/bin/env python3
"""
Profile the engine benchmark and show hot functions.

Usage: ./profile.py [iterations] [--json] [--top N]
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

ENGINE_DIR = Path(__file__).parent
BINARY = ENGINE_DIR / "target/release/bench"
PROFILE_PATH = Path("/tmp/engine-bench-profile.json.gz")
HOMEBREW_PATHS = ["/opt/homebrew/opt/binutils/bin", "/usr/local/opt/binutils/bin"]

REQUIRED_TOOLS = {
    "cargo": "Install Rust: https://rustup.rs",
    "samply": "cargo install samply",
}

OPTIONAL_TOOLS = {
    (
        "addr2line",
        "gaddr2line",
    ): "brew install binutils  # for better symbol resolution",
    ("c++filt", "gc++filt"): "brew install binutils  # for symbol demangling",
}


def find_tool(names: list[str]) -> str | None:
    for name in names:
        if path := shutil.which(name):
            return path
        for prefix in HOMEBREW_PATHS:
            if (full := Path(prefix) / name).exists():
                return str(full)
    return None


def check_dependencies(quiet: bool = False) -> bool:
    """Check for required and optional tools. Returns False if missing required tools."""
    missing_required = []
    missing_optional = []

    for tool, install_hint in REQUIRED_TOOLS.items():
        if not shutil.which(tool):
            missing_required.append((tool, install_hint))

    for names, install_hint in OPTIONAL_TOOLS.items():
        if not find_tool(list(names)):
            missing_optional.append((names[0], install_hint))

    if missing_required:
        print("ERROR: Missing required tools:\n", file=sys.stderr)
        for tool, hint in missing_required:
            print(f"  • {tool}", file=sys.stderr)
            print(f"    Install: {hint}\n", file=sys.stderr)
        return False

    if missing_optional and not quiet:
        print(
            "WARNING: Missing optional tools (profiling will still work):\n",
            file=sys.stderr,
        )
        for tool, hint in missing_optional:
            print(f"  • {tool}", file=sys.stderr)
            print(f"    Install: {hint}\n", file=sys.stderr)

    return True


ADDR2LINE = find_tool(["addr2line", "gaddr2line"])
CXXFILT = find_tool(["c++filt", "gc++filt"])


def run_cmd(cmd: list, **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


def resolve_symbol_macos(addr: str, binary: Path) -> str | None:
    full_addr = hex(0x100000000 + int(addr, 16))
    result = run_cmd(["atos", "-o", str(binary), full_addr])
    sym = result.stdout.strip()
    if not sym or sym.startswith("0x"):
        return None
    if " (in " in sym:
        func, rest = sym.split(" (in ", 1)
        loc = rest.split(") ", 1)[-1] if ") " in rest else ""
        return f"{func} {loc}".strip()
    return sym


def resolve_symbol_gnu(addr: str, binary: Path) -> str | None:
    if not ADDR2LINE:
        return None
    result = run_cmd([ADDR2LINE, "-f", "-e", str(binary), addr])
    mangled = result.stdout.split("\n")[0]
    if CXXFILT:
        result = run_cmd([CXXFILT, mangled])
        return result.stdout.strip() or mangled
    return mangled


def resolve_symbol(addr: str, binary: Path, cache: dict) -> str:
    if addr in cache:
        return cache[addr]
    if not addr.startswith("0x"):
        cache[addr] = addr
        return addr
    resolver = resolve_symbol_macos if sys.platform == "darwin" else resolve_symbol_gnu
    cache[addr] = resolver(addr, binary) or addr
    return cache[addr]


@dataclass
class FunctionProfile:
    name: str
    module: str
    file: str
    line: int | None
    self_pct: float
    total_pct: float
    self_samples: int
    total_samples: int


@dataclass
class ProfileResult:
    timestamp: str
    iterations: int
    duration_ms: float
    throughput: float  # sims/sec
    avg_dps: float
    total_samples: int
    functions: list[FunctionProfile]
    hot_modules: dict[str, float]  # module -> self%


def parse_symbol(raw: str) -> tuple[str, str, str, int | None]:
    """Parse symbol into (name, module, file, line)."""
    # Pattern: "func::path (file.rs:123)" or just "func::path"
    name, file, line = raw, "", None
    if match := re.search(r"\(([^)]+):(\d+)\)\s*$", raw):
        file, line = match.group(1), int(match.group(2))
        name = raw[: match.start()].strip()

    # Extract module from rust path: "crate::module::func" -> "crate::module"
    parts = name.split("::")
    if len(parts) >= 2:
        # Remove hash suffix like "h6f15b9ed2e446930"
        if parts[-1].startswith("h") and len(parts[-1]) == 17:
            parts = parts[:-1]
        module = "::".join(parts[:-1]) if len(parts) > 1 else parts[0]
    else:
        module = name

    return name, module, file, line


def parse_bench_output(output: str) -> tuple[float, float, float]:
    """Extract duration_ms, throughput, avg_dps from bench output."""
    duration_ms, throughput, avg_dps = 0.0, 0.0, 0.0
    for line in output.split("\n"):
        if "Time:" in line:
            if match := re.search(r"([\d.]+)ms", line):
                duration_ms = float(match.group(1))
            elif match := re.search(r"([\d.]+)s", line):
                duration_ms = float(match.group(1)) * 1000
        elif "Throughput:" in line:
            if match := re.search(r"([\d.]+)M", line):
                throughput = float(match.group(1)) * 1_000_000
        elif "Avg DPS:" in line:
            if match := re.search(r"([\d.]+)", line):
                avg_dps = float(match.group(1))
    return duration_ms, throughput, avg_dps


def analyze_profile(iterations: int, bench_output: str, top_n: int) -> ProfileResult:
    with gzip.open(PROFILE_PATH, "rt") as f:
        data = json.load(f)

    thread = next(
        (t for t in data.get("threads", []) if t.get("name") != "samply"), None
    )
    if not thread:
        raise RuntimeError("No thread found in profile")

    strings = thread["stringArray"]
    func_names = thread["funcTable"]["name"]
    frame_funcs = thread["frameTable"]["func"]
    stack_frames = thread["stackTable"]["frame"]
    stack_prefixes = thread["stackTable"]["prefix"]
    samples = thread["samples"]
    stacks, weights = samples["stack"], samples.get(
        "weight", [1] * len(samples["stack"])
    )

    if not stacks:
        raise RuntimeError("No samples collected")

    # Resolve symbols
    cache = {}
    for s in strings:
        resolve_symbol(s, BINARY, cache)

    # Count samples
    self_counts, total_counts = Counter(), Counter()
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
                cache.get(strings[name_idx], strings[name_idx])
                if name_idx < len(strings)
                else "?"
            )
            total_counts[func] += weight
            if is_leaf:
                self_counts[func] += weight
                is_leaf = False
            curr = stack_prefixes[curr] if curr < len(stack_prefixes) else None

    total_weight = sum(weights)
    duration_ms, throughput, avg_dps = parse_bench_output(bench_output)

    # Build function profiles (filter out std/core noise for top list)
    functions = []
    module_self = Counter()

    for name, self_cnt in self_counts.most_common():
        total_cnt = total_counts[name]
        func_name, module, file, line = parse_symbol(name)
        self_pct = self_cnt * 100.0 / total_weight
        total_pct = total_cnt * 100.0 / total_weight

        # Aggregate by module
        module_self[module] += self_pct

        # Skip noise for function list
        if any(module.startswith(p) for p in ["std::", "core::", "alloc::", "_"]):
            continue

        functions.append(
            FunctionProfile(
                name=func_name,
                module=module,
                file=file,
                line=line,
                self_pct=round(self_pct, 2),
                total_pct=round(total_pct, 2),
                self_samples=self_cnt,
                total_samples=total_cnt,
            )
        )

    # Top modules by self time
    hot_modules = {m: round(p, 2) for m, p in module_self.most_common(10) if p >= 0.5}

    return ProfileResult(
        timestamp=datetime.now().isoformat(),
        iterations=iterations,
        duration_ms=round(duration_ms, 2),
        throughput=round(throughput, 0),
        avg_dps=round(avg_dps, 0),
        total_samples=len(stacks),
        functions=functions[:top_n],
        hot_modules=hot_modules,
    )


def print_human(result: ProfileResult):
    print(f"\n{'='*80}")
    print(f"ENGINE PROFILE RESULTS")
    print(f"{'='*80}")
    print(f"Time:       {result.timestamp}")
    print(f"Iterations: {result.iterations:,}")
    print(f"Duration:   {result.duration_ms:.1f}ms")
    print(f"Throughput: {result.throughput/1e6:.2f}M sims/sec")
    print(f"Avg DPS:    {result.avg_dps:.0f}")
    print(f"Samples:    {result.total_samples}")

    print(f"\n{'─'*80}")
    print("HOT MODULES (by self time)")
    print(f"{'─'*80}")
    for mod, pct in result.hot_modules.items():
        bar = "█" * int(pct / 2) + "░" * (50 - int(pct / 2))
        print(f"{pct:5.1f}% {bar[:50]} {mod}")

    print(f"\n{'─'*80}")
    print("HOT FUNCTIONS (by self time, excluding std/core)")
    print(f"{'─'*80}")
    print(f"{'Self':>6} {'Total':>6}  {'Function':<50} {'Location'}")
    print(f"{'─'*6} {'─'*6}  {'─'*50} {'─'*20}")
    for f in result.functions:
        loc = f"{f.file}:{f.line}" if f.line else f.file or ""
        name = f.name[:50] if len(f.name) <= 50 else f.name[:47] + "..."
        print(f"{f.self_pct:5.1f}% {f.total_pct:5.1f}%  {name:<50} {loc}")


def main():
    parser = argparse.ArgumentParser(description="Profile engine benchmark")
    parser.add_argument("iterations", type=int, nargs="?", default=5000)
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--top", type=int, default=20, help="Top N functions")
    args = parser.parse_args()

    if not check_dependencies(quiet=args.json):
        sys.exit(1)

    os.chdir(ENGINE_DIR)

    # Build
    if not args.json:
        print("Building with debug symbols ...")
    subprocess.run(
        ["cargo", "build", "--release", "--bin", "bench"],
        env={**os.environ, "CARGO_PROFILE_RELEASE_DEBUG": "2"},
        check=True,
        capture_output=args.json,
    )

    # Profile
    if not args.json:
        print(f"Profiling {args.iterations} iterations ...")
    bench_result = subprocess.run(
        [str(BINARY), str(args.iterations)], capture_output=True, text=True
    )
    subprocess.run(
        [
            "samply",
            "record",
            "-s",
            "-o",
            str(PROFILE_PATH),
            str(BINARY),
            str(args.iterations),
        ],
        check=True,
        capture_output=True,
    )

    # Analyze
    if not args.json:
        print("Analyzing ...")
    result = analyze_profile(args.iterations, bench_result.stdout, args.top)

    # Output
    if args.json:
        out = asdict(result)
        out["functions"] = [asdict(f) for f in result.functions]
        print(json.dumps(out, indent=2))
    else:
        print_human(result)


if __name__ == "__main__":
    main()
