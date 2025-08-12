"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { getModelCost } from "@/actions/credits/get/get-model-cost.action";
import { ModelCost } from "@/db/schema";

export function useModelCost(modelId: string) {
  const [modelCost, setModelCost] = useState<ModelCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { executeAsync } = useAction(getModelCost);

  useEffect(() => {
    if (!modelId) {
      setLoading(false);
      return;
    }

    const fetchModelCost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await executeAsync({ modelId });
        
        if (result?.data?.success && result.data.result) {
          setModelCost(result.data.result);
        } else {
          setError(result?.data?.errors?._form?.[0] || "Erro ao buscar modelo");
          setModelCost(null);
        }
      } catch (err) {
        setError("Erro ao buscar modelo");
        setModelCost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchModelCost();
  }, [modelId, executeAsync]);

  return { modelCost, loading, error };
}