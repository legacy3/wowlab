import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";

export interface ControlsConfig {
  borderColor?: string;
  cornerColor?: string;
  cornerSize?: number;
  cornerStrokeColor?: string;
  rotatingPointOffset?: number;
}

export class ControlsPlugin implements FabricPlugin {
  readonly name = "controls";

  private config: Required<ControlsConfig>;

  constructor(config: ControlsConfig = {}) {
    this.config = {
      borderColor: config.borderColor ?? "#51B9F9",
      cornerColor: config.cornerColor ?? "#FFF",
      cornerSize: config.cornerSize ?? 10,
      cornerStrokeColor: config.cornerStrokeColor ?? "#0E98FC",
      rotatingPointOffset: config.rotatingPointOffset ?? 30,
    };
  }

  destroy(): void {
    // Controls are set on the prototype, so we don't need to clean up
    // The next plugin instance or page reload will reset them
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by FabricPlugin interface
  init(_canvas: fabric.Canvas, _controller: CanvasController): void {
    // Increase numeric precision for scaling operations
    // Default is toFixed(2), we use toFixed(4) for more accurate scaling
    fabric.config.configure({ NUM_FRACTION_DIGITS: 4 });

    // Apply selection styling to Object prototype
    this.applySelectionStyles();

    // Customize control positions
    this.customizeControls();
  }

  private applySelectionStyles(): void {
    // Set default selection styling on fabric.Object.prototype
    // These will be inherited by all Fabric objects
    Object.assign(fabric.Object.prototype, {
      // Make corners visible (not transparent)
      transparentCorners: false,

      // Border styling
      borderColor: this.config.borderColor,
      borderOpacityWhenMoving: 1,
      borderScaleFactor: 2,

      // Corner styling
      cornerColor: this.config.cornerColor,
      cornerSize: this.config.cornerSize,
      cornerStrokeColor: this.config.cornerStrokeColor,
      cornerStyle: "circle",
    });
  }

  private customizeControls(): void {
    // In Fabric.js v7, controls may not be initialized on prototype yet
    // We need to ensure the controls object exists before modifying
    if (!fabric.Object.prototype.controls) {
      // Controls will be set when objects are created, skip for now
      return;
    }

    // Move rotation control to bottom (default is top with y: -0.5)
    // This makes it easier to access when working with objects near the top of canvas
    if (fabric.Object.prototype.controls.mtr) {
      fabric.Object.prototype.controls.mtr = new fabric.Control({
        actionHandler: fabric.controlsUtils.rotationWithSnapping,
        actionName: "rotate",
        cursorStyleHandler: fabric.controlsUtils.rotationStyleHandler,
        offsetY: this.config.rotatingPointOffset,
        x: 0,
        y: 0.5,
      });
    }
  }
}
