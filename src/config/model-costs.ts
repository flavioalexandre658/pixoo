export const MODEL_COSTS = {
  "flux-schnell": { credits: 1, name: "Pixoo Init" },
  "flux-dev": { credits: 2, name: "Pixoo Gen" },
  "flux-pro": { credits: 5, name: "Pixoo Pro" },
  "flux-pro-1.1": { credits: 5, name: "Pixoo Pro Max" },
  "flux-pro-1.1-ultra": { credits: 6, name: "Pixoo Pro Ultra" },
  "flux-realism": { credits: 3, name: "Pixoo Realism" },
  "flux-kontext-dev": { credits: 4, name: "Pixoo Edit" },
  "flux-kontext-pro": { credits: 4, name: "Pixoo Edit Pro" },
  "flux-kontext-max": { credits: 8, name: "Pixoo Edit Pro Max" },
} as const;

export type ModelId = keyof typeof MODEL_COSTS;

export function getModelCost(
  modelId: string
): { credits: number; name: string } | null {
  return MODEL_COSTS[modelId as ModelId] || null;
}
