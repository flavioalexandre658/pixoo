import { getModelCosts } from "@/actions/credits/get/get-model-costs.action";
import ImageEditing from "./_components/image-editing";
import { ModelCost } from "@/db/schema";

export default async function ImageEditingPage() {
  let models: ModelCost[] = [];
  const res = await getModelCosts({});

  if (!res.serverError && res?.data?.success) {
    models = res.data.result || [];
  }

  const allowedModels = models.filter((model: ModelCost) =>
    ["flux-kontext-pro", "flux-kontext-max"].includes(model.modelId)
  );


  return <ImageEditing models={allowedModels} />;
}
