import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/ui/page-container/page-container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });
  return {
    title: t("title"),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl space-y-8 py-12 lg:py-24">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-grafite-500">
            {t("lastUpdated", { date: new Date() })}
          </p>
        </div>

        <div className="prose prose-lg mx-auto max-w-full text-grafite-600 dark:prose-invert dark:text-grafite-400">
          <h2>1. Introduction</h2>
          <p>
            Welcome to {process.env.NEXT_PUBLIC_APP_NAME}. We are committed to
            protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our application. Please read this privacy policy carefully. If you
            do not agree with the terms of this privacy policy, please do not
            access the application.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect via the Application depends on the
            content and materials you use, and includes:
          </p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Personally identifiable
              information, such as your name, shipping address, email address,
              and telephone number, and demographic information, such as your
              age, gender, hometown, and interests, that you voluntarily give to
              us when you register with the Application or when you choose to
              participate in various activities related to the Application.
            </li>
            <li>
              <strong>Derivative Data:</strong> Information our servers
              automatically collect when you access the Application, such as
              your IP address, your browser type, your operating system, your
              access times, and the pages you have viewed directly before and
              after accessing the Application.
            </li>
            <li>
              <strong>Financial Data:</strong> Financial information, such as
              data related to your payment method (e.g., valid credit card
              number, card brand, expiration date) that we may collect when you
              purchase, order, return, exchange, or request information about
              our services from the Application.
            </li>
          </ul>

          <h2>3. Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Application to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>
              Process your transactions and send you related information,
              including purchase confirmations and invoices.
            </li>
            <li>Email you regarding your account or order.</li>
            <li>Improve our Application and services.</li>
            <li>
              Monitor and analyze usage and trends to improve your experience
              with the Application.
            </li>
          </ul>

          <h2>4. Disclosure of Your Information</h2>
          <p>
            We may share information we have collected about you in certain
            situations. Your information may be disclosed as follows:
          </p>
          <ul>
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the
              release of information about you is necessary to respond to legal
              process, to investigate or remedy potential violations of our
              policies, or to protect the rights, property, and safety of
              others, we may share your information as permitted or required by
              any applicable law, rule, or regulation.
            </li>
            <li>
              <strong>Third-Party Service Providers:</strong> We may share your
              information with third parties that perform services for us or on
              our behalf, including payment processing, data analysis, email
              delivery, hosting services, customer service, and marketing
              assistance.
            </li>
          </ul>

          <h2>5. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at: sac@moriz.ai
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
