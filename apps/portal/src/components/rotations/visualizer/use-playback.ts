"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PlaybackFrame } from "./types";

interface UsePlaybackOptions {
  frames: PlaybackFrame[];
  initialFrame?: number;
}

interface UsePlaybackReturn {
  currentFrameIndex: number;
  currentFrame: PlaybackFrame | null;
  isPlaying: boolean;
  playbackSpeed: number;
  setFrameIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

// TODO Move this to src/hooks and double check if I really have to self bake this q.q
export function usePlayback({
  frames,
  initialFrame = 0,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(initialFrame);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentFrame = frames[currentFrameIndex] ?? null;

  const setFrameIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(frames.length - 1, index));
      setCurrentFrameIndex(clampedIndex);
    },
    [frames.length],
  );

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const stepForward = useCallback(() => {
    setCurrentFrameIndex((prev) => Math.min(frames.length - 1, prev + 1));
  }, [frames.length]);

  const stepBack = useCallback(() => {
    setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  }, []);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      // TODO Real hasted GCD from loaded character
      const intervalMs = 1500 / playbackSpeed;

      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }

          return prev + 1;
        });
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, frames.length]);

  // Stop playing when reaching end
  useEffect(() => {
    if (currentFrameIndex >= frames.length - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentFrameIndex, frames.length, isPlaying]);

  return {
    currentFrameIndex,
    currentFrame,
    isPlaying,
    playbackSpeed,
    setFrameIndex,
    play,
    pause,
    togglePlayPause,
    stepForward,
    stepBack,
    reset,
    setPlaybackSpeed,
  };
}
