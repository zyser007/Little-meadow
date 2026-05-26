// Tools the player can have active. Phase 1 wires hand/hoe/watering-can; axe & pickaxe
// arrive with gathering (Phase 2) but are listed so the tool selector already shows them.

export type ToolId = "hand" | "hoe" | "watering_can" | "axe" | "pickaxe" | "fishing_rod";

export interface ToolDef {
  id: ToolId;
  name: string;
  short: string; // label shown under the Tool button
  color: string; // placeholder accent
  enabled: boolean; // false = present in UI but not yet functional
}

export const TOOLS: ToolDef[] = [
  { id: "hand", name: "Hand", short: "Hand", color: "#e8c9a0", enabled: true },
  { id: "hoe", name: "Hoe", short: "Hoe", color: "#b07a45", enabled: true },
  { id: "watering_can", name: "Watering Can", short: "Water", color: "#5fb4d6", enabled: true },
  { id: "axe", name: "Axe", short: "Axe", color: "#9aa0a6", enabled: true },
  { id: "pickaxe", name: "Pickaxe", short: "Pick", color: "#8a93a0", enabled: true },
  { id: "fishing_rod", name: "Fishing Rod", short: "Rod", color: "#6f9bd6", enabled: true },
];

export const ENABLED_TOOLS: ToolDef[] = TOOLS.filter((t) => t.enabled);

export const TOOL_BY_ID: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
