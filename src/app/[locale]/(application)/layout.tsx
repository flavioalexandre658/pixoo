import { AppLayout } from "@/components/layout/app-layout";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};
export default async function ApplicationLayout({ children }: Props) {
  return <AppLayout>{children}</AppLayout>;
}
