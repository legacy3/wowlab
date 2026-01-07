  Single Evaluation (Fixed State)

  | Approach      | Time    | Speedup vs Rhai |
  |---------------|---------|-----------------|
  | Rhai baseline | 667 ns  | 1x              |
  | Decision Tree | 40.7 ns | 16x             |
  | Bytecode VM   | 5.85 ns | 114x            |
  | Native Enum   | 3.11 ns | 215x            |
  | Lookup Table  | 2.62 ns | 255x            |
  | Native Inline | 0.87 ns | 767x            |

  Random States (1000 different states)

  | Approach      | Time (1000 evals) | Per-eval | Speedup |
  |---------------|-------------------|----------|---------|
  | Rhai          | 1.17 ms           | 1,170 ns | 1x      |
  | Decision Tree | 56.9 µs           | 56.9 ns  | 21x     |
  | Bytecode VM   | 37.8 µs           | 37.8 ns  | 31x     |
  | Native Enum   | 34.0 µs           | 34.0 ns  | 34x     |
  | Lookup Table  | 2.8 µs            | 2.8 ns   | 418x    |
  | Native Inline | 1.8 µs            | 1.8 ns   | 650x    |