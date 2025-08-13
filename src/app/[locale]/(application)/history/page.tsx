import { getModelCosts } from "@/actions/credits/get/get-model-costs.action";
import History from "./_components/history";
import { ModelCost } from "@/db/schema";

export default async function HistoryPage() {
  let models: ModelCost[] = [];
  const res = await getModelCosts({});

  if (!res.serverError && res?.data?.success) {
    models = res.data.result || [];
  }

  return <History models={models} />;
}