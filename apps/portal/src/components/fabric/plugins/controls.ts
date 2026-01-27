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

  destroy(): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by FabricPlugin interface
  init(_canvas: fabric.Canvas, _controller: CanvasController): void {
    fabric.config.configure({ NUM_FRACTION_DIGITS: 4 });
    this.applySelectionStyles();
    this.customizeControls();
  }

  private applySelectionStyles(): void {
    Object.assign(fabric.Object.prototype, {
      borderColor: this.config.borderColor,
      borderOpacityWhenMoving: 1,
      borderScaleFactor: 2,
      cornerColor: this.config.cornerColor,
      cornerSize: this.config.cornerSize,
      cornerStrokeColor: this.config.cornerStrokeColor,
      cornerStyle: "circle",
      transparentCorners: false,
    });
  }

  private customizeControls(): void {
    if (!fabric.Object.prototype.controls) {
      return;
    }

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
