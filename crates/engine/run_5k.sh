#!/bin/bash
cd "$(dirname "${BASH_SOURCE[0]}")"
../target/release/engine sim -s bm-hunter -i 5000 "$@"
