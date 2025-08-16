import { getTranslations } from "next-intl/server";
import { Fragment } from "react";

import { PageContainer } from "@/components/ui/page-container/page-container";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupportedLocale } from "@/interfaces/shared.interface";
import { Shield } from "lucide-react";

import Footer from "../_components/footer";
import { Navbar } from "../_components/navbar";

type Props = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata() {
  return {
    title: "Privacy Policy - Pixoo",
    description: "Privacy Policy for Pixoo AI Image Generation Platform",
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  
  return (
    <TooltipProvider>
      <Fragment>
        <Navbar locale={locale} />
        <main>
          <PageContainer>
      <div className="relative py-12 lg:py-24 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-pixoo-purple/5 via-pixoo-pink/5 to-pixoo-magenta/10 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent -z-10" />
        <div className="absolute top-20 left-20 w-60 h-60 bg-gradient-to-br from-pixoo-purple/10 to-pixoo-pink/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-pixoo-magenta/8 to-pixoo-purple/8 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl space-y-8 px-6">
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pixoo-purple to-pixoo-pink rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-pixoo-magenta bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg mx-auto max-w-full text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Pixoo (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered image generation platform (the &ldquo;Service&rdquo;). By using our Service, you agree to the collection and use of information in accordance with this policy.
            </p>

            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following personal information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, username, and password</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through third-party payment processors)</li>
              <li><strong>Profile Information:</strong> Profile picture, preferences, and settings</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support requests</li>
            </ul>

            <h3>2.2 Usage Data</h3>
            <p>We automatically collect information about your use of our Service:</p>
            <ul>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Usage Analytics:</strong> Pages visited, features used, time spent, click patterns</li>
              <li><strong>Performance Data:</strong> Error logs, crash reports, response times</li>
            </ul>

            <h3>2.3 AI-Generated Content Data</h3>
            <p>When you use our AI image generation features:</p>
            <ul>
              <li><strong>Text Prompts:</strong> All text inputs and prompts you provide to generate images</li>
              <li><strong>Generated Images:</strong> Images created through our AI models</li>
              <li><strong>Interaction Data:</strong> Ratings, favorites, downloads, and sharing activities</li>
              <li><strong>Model Usage:</strong> Which AI models you use and generation parameters</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our AI image generation services</li>
              <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
              <li><strong>AI Model Training:</strong> To improve our AI models and algorithms (with appropriate safeguards)</li>
              <li><strong>Content Moderation:</strong> To detect and prevent generation of inappropriate, harmful, or illegal content</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect against misuse</li>
              <li><strong>Communication:</strong> To send service updates, security alerts, and promotional materials (with your consent)</li>
            </ul>

            <h2>4. AI Content and Intellectual Property</h2>
            
            <h3>4.1 Generated Content Ownership</h3>
            <p>
              You retain ownership of the text prompts you provide. Generated images are subject to our Terms of Service. We reserve the right to use generated content for service improvement and model training purposes.
            </p>

            <h3>4.2 Content Moderation and Safety</h3>
            <p>
              We implement automated and manual content moderation to prevent generation of:
            </p>
            <ul>
              <li>Illegal, harmful, or abusive content</li>
              <li>Content that violates intellectual property rights</li>
              <li>Deepfakes or misleading synthetic media of real persons</li>
              <li>Content that could cause confusion about authenticity</li>
              <li>Sexually explicit or violent content involving minors</li>
            </ul>

            <h2>5. Data Sharing and Disclosure</h2>
            
            <h3>5.1 Third-Party Service Providers</h3>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>AI Model Providers:</strong> Third-party AI services that power our image generation</li>
              <li><strong>Cloud Infrastructure:</strong> Hosting and storage providers</li>
              <li><strong>Payment Processors:</strong> For billing and subscription management</li>
              <li><strong>Analytics Services:</strong> For usage analysis and service improvement</li>
            </ul>

            <h3>5.2 Legal Requirements</h3>
            <p>We may disclose your information when required by law or to:</p>
            <ul>
              <li>Comply with legal processes, court orders, or government requests</li>
              <li>Protect our rights, property, or safety, or that of our users</li>
              <li>Investigate potential violations of our Terms of Service</li>
              <li>Prevent fraud, abuse, or illegal activities</li>
            </ul>

            <h2>6. Data Security and Retention</h2>
            
            <h3>6.1 Security Measures</h3>
            <p>
              We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your information.
            </p>

            <h3>6.2 Data Retention</h3>
            <p>We retain your information for as long as necessary to:</p>
            <ul>
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Improve our AI models (with anonymization where possible)</li>
            </ul>

            <h2>7. Your Rights and Choices</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for optional data processing</li>
            </ul>

            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
            </p>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
            </p>

            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </p>

            <h2>11. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@pixoo.com</li>
              <li>Address: [Company Address]</li>
            </ul>

            <h2>12. Jurisdiction and Governing Law</h2>
            <p>
              This Privacy Policy is governed by and construed in accordance with the laws of [Jurisdiction]. Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the courts of [Jurisdiction].
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
        </main>
        <Footer />
      </Fragment>
    </TooltipProvider>
  );
}
