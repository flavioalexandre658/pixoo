export const MODEL_COSTS = {
  "flux-schnell": { credits: 0, name: "Pixoo Schnell" },
  "flux-dev": { credits: 2, name: "Pixoo Dev" },
  "flux-pro": { credits: 5, name: "Pixoo Pro" },
  "flux-pro-1.1": { credits: 4, name: "Pixoo Pro 2" },
  "flux-pro-1.1-ultra": { credits: 6, name: "Pixoo Pro 2 Ultra" },
  "flux-realism": { credits: 3, name: "Pixoo Realism" },
  "flux-kontext-pro": { credits: 4, name: "Pixoo Context" },
} as const;

export type ModelId = keyof typeof MODEL_COSTS;

export function getModelCost(
  modelId: string
): { credits: number; name: string } | null {
  return MODEL_COSTS[modelId as ModelId] || null;
}
