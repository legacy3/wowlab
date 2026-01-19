// =============================================================================
// Timeline Data Types
// =============================================================================

export interface TimelineData {
  duration: number; // total timeline duration in ms
  events: TimelineEvent[];
  tracks: string[]; // track names
}

export interface TimelineEvent {
  color: string;
  duration: number; // ms
  id: string;
  name: string;
  startTime: number; // ms
  track: number;
}

// =============================================================================
// Render Options
// =============================================================================

export interface TimelineRenderOptions {
  onEventClick?: (event: TimelineEvent) => void;
  onEventHover?: (data: TimelineTooltipData | null) => void;
  playheadPosition?: number; // ms
}

export interface TimelineTooltipData {
  event: TimelineEvent;
  screenX: number;
  screenY: number;
}
