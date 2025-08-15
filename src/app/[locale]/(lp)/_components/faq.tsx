"use client";

import {
  CreditCard,
  HardDriveDownload,
  MessageCircle,
  NotebookText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const iconMap = {
  shieldCheck: ShieldCheck,
  notebookText: NotebookText,
  messageCircle: MessageCircle,
  hardDriveDownload: HardDriveDownload,
  creditCard: CreditCard,
  refreshCcw: RefreshCcw,
};

const FAQ = () => {
  const t = useTranslations("landingPage.faq");

  const faqItems = [
    {
      question: "O que é o Pixoo?",
      answer:
        "O Pixoo é uma plataforma de inteligência artificial que permite criar imagens incríveis a partir de descrições de texto. Nossa IA avançada transforma suas ideias em arte visual de alta qualidade.",
      icon: iconMap.shieldCheck,
    },
    {
      question: "Como funciona a geração de imagens?",
      answer:
        "Simplesmente descreva o que você quer ver em texto e nossa IA criará uma imagem única baseada na sua descrição. Você pode ajustar estilos, dimensões e outros parâmetros para obter o resultado perfeito.",
      icon: iconMap.notebookText,
    },
    {
      question: "Posso usar as imagens comercialmente?",
      answer:
        "Sim! Com nossos planos pagos, você tem direitos comerciais completos sobre as imagens geradas. Pode usar em projetos pessoais, comerciais, marketing e muito mais.",
      icon: iconMap.creditCard,
    },
    {
      question: "Qual a qualidade das imagens geradas?",
      answer:
        "Nossas imagens são geradas em alta resolução com qualidade profissional. Oferecemos diferentes tamanhos e estilos para atender suas necessidades específicas.",
      icon: iconMap.hardDriveDownload,
    },
    {
      question: "Preciso de conhecimento técnico?",
      answer:
        "Não! O Pixoo foi projetado para ser intuitivo e fácil de usar. Qualquer pessoa pode criar imagens incríveis, independentemente do nível de experiência técnica.",
      icon: iconMap.messageCircle,
    },
    {
      question: "Posso editar imagens existentes?",
      answer:
        "Sim! Além de criar novas imagens, você pode fazer upload de imagens existentes e usar nossa IA para editá-las, remover fundos, alterar estilos e muito mais.",
      icon: iconMap.refreshCcw,
    },
  ];

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
      id="faq"
      className="relative min-h-screen flex items-center justify-center px-6 py-12 xs:py-16 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-20 left-20 w-60 h-60 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-pixoo-magenta/8 to-pixoo-purple/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-screen-lg">
        <div className="text-center mb-16">
          <h2 className="text-4xl xs:text-4xl md:text-5xl !leading-[1.15] font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-pixoo-magenta bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-6 bg-background/50 rounded-3xl overflow-hidden backdrop-blur-sm border border-border/50 shadow-2xl">
          {faqItems.map(({ question, answer, icon: Icon }, index) => (
            <div
              key={question}
              className="group relative p-8 hover:bg-gradient-to-br hover:from-pixoo-purple/5 hover:to-pixoo-pink/5 transition-all duration-500 border-r border-b border-border/30 last:border-r-0 md:even:border-r-0 md:last:border-b-0 md:[&:nth-last-child(2)]:border-b-0"
            >
              <div
                className={`h-12 w-12 xs:h-14 xs:w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradients[index]} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500 mb-6`}
              >
                <Icon className="h-6 w-6 xs:h-7 xs:w-7 text-white group-hover:rotate-12 transition-transform duration-500" />
              </div>

              <div className="mb-4 flex items-start gap-2 text-xl xs:text-[1.35rem] font-semibold tracking-tight group-hover:text-pixoo-magenta transition-colors duration-300">
                <span>{question}</span>
              </div>

              <p className="text-base xs:text-lg text-muted-foreground leading-relaxed">
                {answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
