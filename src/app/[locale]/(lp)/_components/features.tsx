"use client";

import {
  Image as ImageIcon,
  Wand2,
  Zap,
  Palette,
  Download,
  Sparkles,
  Brain,
  Clock,
  Monitor,
  Users,
  Shield,
  Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardHeader } from "@/components/ui/card";
import { SupportedLocale } from "@/interfaces/shared.interface";

const iconMap = {
  image: ImageIcon,
  wand: Wand2,
  zap: Zap,
  palette: Palette,
  download: Download,
  sparkles: Sparkles,
  brain: Brain,
  clock: Clock,
  monitor: Monitor,
  users: Users,
  shield: Shield,
  layers: Layers,
};

const featureKeyToIconKey: Record<string, keyof typeof iconMap> = {
  feature1: "image",
  feature2: "wand",
  feature3: "zap",
  feature4: "palette",
  feature5: "download",
  feature6: "sparkles",
  advancedModels: "brain",
  fastGeneration: "clock",
  highResolution: "monitor",
  easyToUse: "users",
  commercialLicense: "shield",
  multipleStyles: "layers",
};

interface FeaturesProps {
  pageType?: string;
  locale?: SupportedLocale;
}

const Features = ({ pageType = "landingPage", locale }: FeaturesProps) => {
  const namespace = pageType === "aiImageGenerator" ? "aiImageGenerator.features" : "landingPage.features";
  const t = useTranslations(namespace);

  const featureKeys = pageType === "aiImageGenerator"
    ? ["advancedModels", "fastGeneration", "highResolution", "easyToUse", "commercialLicense", "multipleStyles"] as const
    : ["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"] as const;

  const features = featureKeys.map((key) => ({
    icon: iconMap[featureKeyToIconKey[key]],
    title: t(`${key}.title`),
    description: t(`${key}.description`),
  }));

  const gradients = [
    "from-pixoo-purple to-pixoo-pink",
    "from-pixoo-pink to-pixoo-magenta",
    "from-pixoo-magenta to-pixoo-purple",
    "from-pixoo-dark to-pixoo-purple",
    "from-pixoo-pink to-pixoo-dark",
    "from-pixoo-magenta to-pixoo-pink",
  ];

  return (
    <div
      id="features"
      className="relative max-w-screen-xl mx-auto w-full py-12 xs:py-16 px-6 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-br from-pixoo-magenta/8 to-pixoo-purple/8 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-bold tracking-tight sm:max-w-2xl sm:mx-auto bg-gradient-to-br from-foreground via-foreground to-pixoo-magenta bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-12 xs:mt-16 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group cursor-pointer relative flex flex-col border-2 border-border/50 rounded-2xl overflow-hidden shadow-none hover:shadow-2xl hover:shadow-pixoo-purple/10 transition-all duration-500 hover:scale-105 hover:border-pixoo-magenta/30 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm"
            >
              {/* Card background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-transparent to-pixoo-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="relative text-center p-8">
                <div
                  className={`mx-auto w-16 h-16 bg-gradient-to-br ${gradients[index]} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}
                >
                  <feature.icon className="text-white w-8 h-8 group-hover:rotate-12 transition-transform duration-500" />
                </div>

                <h4 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-pixoo-magenta transition-colors duration-300">
                  {feature.title}
                </h4>

                <p className="text-muted-foreground text-base leading-relaxed">
                  {feature.description}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
