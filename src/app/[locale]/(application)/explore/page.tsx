import { getPublicImages } from "@/actions/images/get/get-public-images.action";
import ExplorePage from "./_components/explore";

export default async function Explore() {
  const response = await getPublicImages({ limit: 50 });
  
  let images: any[] = [];
  
  if (response?.data?.success) {
    images = response.data.data || [];
  }

  return <ExplorePage images={images} />;
}