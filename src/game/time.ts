// Clock + day/night helpers. Time advances in real time during play; sleeping resets to morning of
// the next day. The renderer uses tintFor() to wash the scene with a time-of-day colour.

export const MINUTES_PER_SECOND = 2; // 1 real second = 2 in-game minutes (~ a full day in minutes)
export const WAKE_MINUTES = 6 * 60; // 06:00

export type Phase = "morning" | "noon" | "evening" | "night";

export function phaseOf(min: number): Phase {
  const h = (min / 60) % 24;
  if (h >= 5 && h < 10) return "morning";
  if (h >= 10 && h < 17) return "noon";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

export function formatClock(min: number): string {
  const total = Math.floor(min) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface Tint {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Full-screen overlay colour for the current time of day.
export function tintFor(min: number): Tint {
  switch (phaseOf(min)) {
    case "morning":
      return { r: 255, g: 210, b: 140, a: 0.1 };
    case "noon":
      return { r: 255, g: 255, b: 255, a: 0 };
    case "evening":
      return { r: 255, g: 130, b: 50, a: 0.18 };
    case "night":
      return { r: 26, g: 28, b: 86, a: 0.42 };
  }
}

// Sky / backdrop colour behind the map.
export function skyColor(min: number): string {
  switch (phaseOf(min)) {
    case "morning":
      return "#bfe3d6";
    case "noon":
      return "#a9ddc6";
    case "evening":
      return "#e7b58a";
    case "night":
      return "#2c2f55";
  }
}
