import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const NavMenu = ({
  className,
  orientation = "horizontal",
}: NavMenuProps) => {
  const t = useTranslations("landingPage.navbar");

  const menuItems = [
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
    { href: "#testimonials", label: t("testimonials") },
  ];

  return (
    <nav
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col items-start space-y-6" : "gap-8",
        className
      )}
    >
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group relative text-sm font-medium text-foreground/80 hover:text-pixoo-magenta transition-all duration-300 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-pixoo-magenta/10 hover:to-pixoo-pink/10 hover:scale-105",
            orientation === "vertical" ? "w-full text-left" : ""
          )}
        >
          {item.label}
          <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-pixoo-pink to-pixoo-magenta transition-all duration-300 group-hover:w-8 group-hover:-translate-x-1/2" />
        </Link>
      ))}
    </nav>
  );
};
