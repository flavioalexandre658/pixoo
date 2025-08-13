import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface PageTitleMap {
  [key: string]: string;
}

export function usePageTitle() {
  const [currentPath, setCurrentPath] = useState("/");
  const t = useTranslations("navigation");
  const pathname = usePathname();

  useEffect(() => {
    // Remove locale from pathname (e.g., /pt/create-image -> /create-image)
    const pathWithoutLocale =
      pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    setCurrentPath(pathWithoutLocale);
  }, [pathname]);

  const pageTitleMap: PageTitleMap = {
    "/": t("home"),
    "/explore": t("explore"),
    "/create-image": t("textToImage"),
    "/edit-image": t("imageEditing"),
    "/history": t("history"),
  };

  return {
    currentPath,
    pageTitle: pageTitleMap[currentPath] || t("home"),
  };
}