import { getModelCosts } from "@/actions/credits/get/get-model-costs.action";
import TextToImage from "./_components/text-to-image";
import { ModelCost } from "@/db/schema";

export default async function Home() {
  let models: ModelCost[] = [];
  const res = await getModelCosts({});

  if (!res.serverError && res?.data?.success) {
    models = res.data.result || [];
  }

  const allowedModels = models.filter((model: ModelCost) =>
    [
      "flux-schnell",
      "flux-dev",
      "flux-pro",
      "flux-pro-1.1",
      "flux-pro-1.1-ultra",
      "flux-realism",
    ].includes(model.modelId)
  );


  return <TextToImage models={allowedModels} />;
}
