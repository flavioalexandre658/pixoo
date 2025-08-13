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
    // Remove locale from pathname (e.g., /pt/text-to-image -> /text-to-image)
    const pathWithoutLocale =
      pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    setCurrentPath(pathWithoutLocale);
  }, [pathname]);

  const pageTitleMap: PageTitleMap = {
    "/": t("home"),
    "/explore": t("explore"),
    "/text-to-image": t("textToImage"),
    "/image-editing": t("imageEditing"),
    "/history": t("history"),
  };

  return {
    currentPath,
    pageTitle: pageTitleMap[currentPath] || t("home"),
  };
}