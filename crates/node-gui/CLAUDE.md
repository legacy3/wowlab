# node-gui

**RULE: Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. Update ALL usages and remove the old thing entirely.

GUI application for the distributed simulation node using egui.

## Commands

```bash
cargo build --release
./target/release/node-gui
```

## Architecture

```
src/
  main.rs            - Entry point
  app.rs             - Application state
  ui/
    dashboard.rs     - Main dashboard view
    logs.rs          - Log viewer
    settings.rs      - Settings panel
    update_modal.rs  - Update notification dialog
    theme.rs         - UI theming
    icons.rs         - Icon definitions
```

Desktop application built with:

- `eframe` / `egui` - Immediate mode GUI framework
- `wowlab-node` - Shared node library (networking, simulation)
- `tokio` - Async runtime for background operations

## Features

- Visual node status and statistics
- Real-time job monitoring
- Auto-update notifications

## Dependencies

- `wowlab-node` - Core node functionality
- `eframe` / `egui` - GUI framework
- `egui-notify`, `egui-modal`, `egui_plot` - UI components
- `lucide-icons` - Icon set
- `tokio` - Async runtime
- `clap` - CLI parsing
- `mimalloc` - Memory allocator
