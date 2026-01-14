"use client";

import { useEffect, useState } from "react";

export function useActiveHeading(headingIds: string[]): string {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headingIds]);

  return activeId;
}
