#!/usr/bin/env python3
"""
Profile the bench-engine and show hot functions.

Usage:
    ./profile.py [iterations]

Example:
    ./profile.py 3000
"""

import json
import gzip
import subprocess
import sys
import os
from collections import Counter
from pathlib import Path
import shutil

SCRIPT_DIR = Path(__file__).parent
BINARY = SCRIPT_DIR / "target/release/bench-engine"
PROFILE_PATH = "/tmp/bench-engine-profile.json.gz"

# Find addr2line (gaddr2line on macOS via Homebrew)
def find_tool(names, extra_paths=None):
    """Find a tool by trying multiple names and paths."""
    extra_paths = extra_paths or []
    for name in names:
        path = shutil.which(name)
        if path:
            return path
        for prefix in extra_paths:
            full = Path(prefix) / name
            if full.exists():
                return str(full)
    return None

HOMEBREW_BINUTILS = ["/opt/homebrew/opt/binutils/bin", "/usr/local/opt/binutils/bin"]
ADDR2LINE = find_tool(["addr2line", "gaddr2line"], HOMEBREW_BINUTILS)
CXXFILT = find_tool(["c++filt", "gc++filt"], HOMEBREW_BINUTILS)

def run_profiler(iterations: int):
    """Run samply and save profile."""
    print(f"Profiling {iterations} iterations...")
    subprocess.run([
        "samply", "record", "-s", "-o", PROFILE_PATH,
        str(BINARY), str(iterations)
    ], check=True)

def resolve_symbol(addr: str, binary: Path, cache: dict) -> str:
    """Resolve hex address to function name."""
    if addr in cache:
        return cache[addr]

    if not addr.startswith("0x"):
        cache[addr] = addr
        return addr

    # Try atos first (macOS native), then addr2line (Linux/GNU)
    if sys.platform == "darwin":
        # Add base address for Mach-O binaries (typically 0x100000000 for arm64/x86_64)
        addr_int = int(addr, 16)
        full_addr = hex(0x100000000 + addr_int)
        result = subprocess.run(
            ["atos", "-o", str(binary), full_addr],
            capture_output=True, text=True
        )
        demangled = result.stdout.strip()
        if demangled and not demangled.startswith("0x"):
            # Keep file:line info for inlined code visibility
            # Format: "func_name (in binary) (file.rs:123)" -> "func_name (file.rs:123)"
            if " (in " in demangled:
                parts = demangled.split(" (in ")
                func = parts[0]
                if len(parts) > 1 and ")" in parts[1]:
                    loc = parts[1].split(") ", 1)[-1] if ") " in parts[1] else ""
                    demangled = f"{func} {loc}".strip()
            cache[addr] = demangled
            return demangled

    if ADDR2LINE:
        result = subprocess.run(
            [ADDR2LINE, "-f", "-e", str(binary), addr],
            capture_output=True, text=True
        )
        mangled = result.stdout.split("\n")[0]

        if CXXFILT:
            result = subprocess.run(
                [CXXFILT, mangled],
                capture_output=True, text=True
            )
            demangled = result.stdout.strip() or mangled
        else:
            demangled = mangled
        cache[addr] = demangled
        return demangled

    cache[addr] = addr
    return addr

def analyze_profile():
    """Parse profile and print hot functions."""
    with gzip.open(PROFILE_PATH, "rt") as f:
        data = json.load(f)

    # Find the main thread (not samply thread)
    thread = None
    for t in data.get("threads", []):
        if t.get("name") != "samply":
            thread = t
            break

    if not thread:
        print("No thread found!")
        return

    string_array = thread["stringArray"]
    func_table = thread["funcTable"]
    frame_table = thread["frameTable"]
    stack_table = thread["stackTable"]
    samples = thread["samples"]

    sample_stacks = samples["stack"]
    sample_weights = samples.get("weight", [1] * len(sample_stacks))

    if not sample_stacks:
        print("No samples collected!")
        return

    print(f"\nCollected {len(sample_stacks)} samples\n")

    # Resolve all symbols
    print("Resolving symbols...")
    cache = {}
    for s in string_array:
        resolve_symbol(s, BINARY, cache)

    # Count samples
    func_names = func_table["name"]
    frame_funcs = frame_table["func"]
    stack_frames = stack_table["frame"]
    stack_prefixes = stack_table["prefix"]

    self_counts = Counter()
    total_counts = Counter()

    for i, stack_idx in enumerate(sample_stacks):
        if stack_idx is None:
            continue

        weight = sample_weights[i] if i < len(sample_weights) else 1
        is_leaf = True
        curr = stack_idx
        seen = set()

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
            raw_name = string_array[name_idx] if name_idx < len(string_array) else "?"
            func_name = cache.get(raw_name, raw_name)

            total_counts[func_name] += weight
            if is_leaf:
                self_counts[func_name] += weight
                is_leaf = False

            curr = stack_prefixes[curr] if curr < len(stack_prefixes) else None

    total_weight = sum(sample_weights)

    print("\n" + "=" * 100)
    print("SELF TIME (where CPU actually spends time)")
    print("=" * 100)
    for name, count in self_counts.most_common(25):
        pct = count * 100.0 / total_weight
        print(f"{pct:5.1f}%  {name[:95]}")

    print("\n" + "=" * 100)
    print("TOTAL TIME (including time in callees)")
    print("=" * 100)
    for name, count in total_counts.most_common(25):
        pct = count * 100.0 / total_weight
        print(f"{pct:5.1f}%  {name[:95]}")

def main():
    iterations = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

    # Build with debug symbols
    print("Building with debug symbols...")
    os.chdir(SCRIPT_DIR)
    subprocess.run(
        ["cargo", "build", "--release", "--features", "bucket_queue"],
        env={**os.environ, "CARGO_PROFILE_RELEASE_DEBUG": "2"},
        check=True
    )

    run_profiler(iterations)
    analyze_profile()

if __name__ == "__main__":
    main()
