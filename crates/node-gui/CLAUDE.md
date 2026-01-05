# node-gui

GUI application for the distributed simulation node using egui.

## Commands

```bash
cargo build --release
./target/release/node-gui
```

## Architecture

Desktop application built with:
- `eframe` / `egui` - Immediate mode GUI framework
- `node` - Shared node library (networking, simulation)
- `tokio` - Async runtime for background operations

## Features

- Visual node status and statistics
- Pairing code display for account linking
- Real-time job monitoring
- Auto-update notifications
- System tray integration (platform-dependent)

## Dependencies

- `node` - Core node functionality
- `eframe` / `egui` - GUI framework
- `lucide-icons` - Icon set
- `image` - Image loading for assets
