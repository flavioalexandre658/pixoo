"use client";

import { GithubIcon, TwitterIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import Logo from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";

const Footer = () => {
  const t = useTranslations("footer");

  const footerLinks = [
    { title: t("links.features"), href: "#features" },
    { title: t("links.pricing"), href: "#pricing" },
    { title: t("links.faq"), href: "#faq" },
    { title: t("links.testimonials"), href: "#testimonials" },
  ];

  const socialLinks = [
    { name: "Twitter", icon: TwitterIcon, href: "https://twitter.com/pixoo" },
    { name: "GitHub", icon: GithubIcon, href: "https://github.com/pixoo" },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-pixoo-dark via-pixoo-purple to-pixoo-dark text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pixoo-pink/20 to-pixoo-magenta/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-pixoo-purple/20 to-pixoo-pink/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 xl:px-0">
        <div className="py-20 grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-x-8">
          {/* Logo, tagline, and social links */}
          <div className="md:col-span-12 lg:col-span-5">
            <Logo customLogo="./images/icon.svg" className="text-white" />
            <p className="mt-6 text-white/80 max-w-sm text-lg leading-relaxed">
              {t("tagline")}
            </p>
            <div className="mt-8 flex items-center gap-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  aria-label={link.name}
                  className="group p-3 bg-white/10 hover:bg-gradient-to-r hover:from-pixoo-pink hover:to-pixoo-magenta rounded-xl text-white/80 hover:text-white transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                >
                  <link.icon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-4 lg:col-span-2 lg:mx-auto">
            <h6 className="font-semibold text-lg text-white mb-2">
              {t("platform")}
            </h6>
            <ul className="mt-6 space-y-4">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-white/70 hover:text-white hover:text-pixoo-pink transition-colors duration-300 text-base"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-8 lg:col-span-5">
            <h6 className="font-semibold text-lg text-white mb-2">
              {t("newsletter.title")}
            </h6>
            <p className="mt-4 text-base text-white/70 leading-relaxed">
              {t("newsletter.description")}
            </p>
            <form className="mt-6 flex items-center gap-3 max-w-sm">
              <Input
                type="email"
                placeholder={t("newsletter.emailPlaceholder")}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pixoo-pink backdrop-blur-sm"
              />
              <Button className="bg-gradient-to-r from-pixoo-pink to-pixoo-magenta hover:from-pixoo-magenta hover:to-pixoo-pink text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {t("newsletter.subscribe")}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-8 border-t border-white/20 flex justify-center items-center">
          <span className="text-sm text-white/60 text-center">
            © {new Date().getFullYear()} Pixoo. {t("copyright")}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
