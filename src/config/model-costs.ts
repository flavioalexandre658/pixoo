export const MODEL_COSTS = {
  "flux-schnell": { credits: 0, name: "Flux Schnell" },
  "flux-dev": { credits: 2, name: "Flux Dev" },
  "flux-pro": { credits: 5, name: "Flux Pro" },
  "flux-pro-1.1": { credits: 4, name: "Flux Pro 1.1" },
  "flux-pro-1.1-ultra": { credits: 6, name: "Flux Pro 1.1 Ultra" },
  "flux-realism": { credits: 3, name: "Flux Realism" },
  "flux-kontext-pro": { credits: 4, name: "Flux Kontext Pro" },
} as const;

export type ModelId = keyof typeof MODEL_COSTS;

export function getModelCost(modelId: string): { credits: number; name: string } | null {
  return MODEL_COSTS[modelId as ModelId] || null;
}