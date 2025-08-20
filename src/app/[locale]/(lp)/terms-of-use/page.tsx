import { Fragment } from "react";

import { PageContainer } from "@/components/ui/page-container/page-container";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupportedLocale } from "@/interfaces/shared.interface";
import { FileText } from "lucide-react";

import Footer from "../_components/footer";
import { Navbar } from "../_components/navbar";

type Props = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata() {
  return {
    title: "Terms of Use - Pixoo",
    description: "Terms of Use for Pixoo AI Image Generation Platform",
  };
}

export default async function TermsOfUsePage({ params }: Props) {
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
              <div className="absolute top-20 right-20 w-60 h-60 bg-gradient-to-br from-pixoo-magenta/10 to-pixoo-purple/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-pixoo-pink/8 to-pixoo-magenta/8 rounded-full blur-3xl" />

              <div className="relative z-10 mx-auto max-w-4xl space-y-8 px-6">
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pixoo-magenta to-pixoo-purple rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <FileText className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-pixoo-magenta bg-clip-text text-transparent">
                    Terms of Use
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="prose prose-lg mx-auto max-w-full text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground">
                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using Pixoo (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Use (&ldquo;Terms&rdquo;). If you disagree with any part of these terms, you may not access the Service. These Terms constitute a legally binding agreement between you and Pixoo.
                  </p>

                  <h2>2. Description of Service</h2>
                  <p>
                    Pixoo is an AI-powered image generation platform that allows users to create images using artificial intelligence models. The Service includes web-based tools, APIs, and related features for generating, editing, and managing AI-created content.
                  </p>

                  <h2>3. User Accounts and Eligibility</h2>
                  
                  <h3>3.1 Account Creation</h3>
                  <p>To use certain features, you must create an account and provide accurate information. You are responsible for maintaining the confidentiality of your account credentials.</p>
                  
                  <h3>3.2 Eligibility</h3>
                  <p>You must be at least 13 years old to use this Service. Users under 18 must have parental consent. By using the Service, you represent that you meet these requirements.</p>

                  <h2>4. Acceptable Use Policy</h2>
                  
                  <h3>4.1 Permitted Uses</h3>
                  <p>You may use the Service for lawful purposes including:</p>
                  <ul>
                    <li>Creating original artistic and creative content</li>
                    <li>Commercial use in accordance with your subscription plan</li>
                    <li>Educational and research purposes</li>
                    <li>Personal entertainment and experimentation</li>
                  </ul>

                  <h3>4.2 Prohibited Uses</h3>
                  <p>You agree NOT to use the Service to generate, create, or distribute:</p>
                  <ul>
                    <li><strong>Illegal Content:</strong> Content that violates any applicable laws or regulations</li>
                    <li><strong>Harmful Content:</strong> Content promoting violence, terrorism, or harm to individuals or groups</li>
                    <li><strong>Deepfakes:</strong> Realistic images of real people without their consent, especially public figures</li>
                    <li><strong>Misleading Content:</strong> Content intended to deceive or spread misinformation</li>
                    <li><strong>Adult Content:</strong> Sexually explicit, pornographic, or adult content</li>
                    <li><strong>Copyrighted Material:</strong> Content that infringes on intellectual property rights</li>
                    <li><strong>Harassment Content:</strong> Content targeting individuals for harassment or abuse</li>
                    <li><strong>Spam or Malicious Content:</strong> Content designed to spam, phish, or distribute malware</li>
                    <li><strong>Biased or Discriminatory Content:</strong> Content promoting discrimination based on protected characteristics</li>
                  </ul>

                  <h2>5. Intellectual Property Rights</h2>
                  
                  <h3>5.1 Service Ownership</h3>
                  <p>
                    The Service, including all software, algorithms, models, and related intellectual property, is owned by Pixoo and protected by copyright, trademark, and other laws.
                  </p>

                  <h3>5.2 User-Generated Content</h3>
                  <p>
                    You retain ownership of text prompts you provide. Generated images are subject to the following:
                  </p>
                  <ul>
                    <li>You may use generated images in accordance with your subscription plan</li>
                    <li>We reserve rights to use generated content for service improvement and model training</li>
                    <li>You grant us a license to store, process, and display your content as necessary to provide the Service</li>
                    <li>You are responsible for ensuring your use doesn&apos;t infringe third-party rights</li>
                  </ul>

                  <h3>5.3 AI Model Training</h3>
                  <p>
                    By using the Service, you acknowledge that your inputs and generated content may be used to improve our AI models, subject to our Privacy Policy and content filtering.
                  </p>

                  <h2>6. Content Moderation and Enforcement</h2>
                  
                  <h3>6.1 Automated Filtering</h3>
                  <p>
                    We employ automated systems to detect and prevent generation of prohibited content. These systems may occasionally produce false positives or negatives.
                  </p>

                  <h3>6.2 Reporting and Review</h3>
                  <p>
                    Users may report content that violates these Terms. We reserve the right to review, remove, or restrict access to any content at our discretion.
                  </p>

                  <h3>6.3 Account Suspension</h3>
                  <p>
                    We may suspend or terminate accounts that repeatedly violate these Terms or engage in prohibited activities.
                  </p>

                  <h2>7. Subscription and Payment Terms</h2>
                  
                  <h3>7.1 Subscription Plans</h3>
                  <p>
                    Access to certain features requires a paid subscription. Subscription terms, pricing, and features are described on our pricing page.
                  </p>

                  <h3>7.2 Payment and Billing</h3>
                  <p>
                    Subscriptions are billed in advance on a recurring basis. You authorize us to charge your payment method for applicable fees.
                  </p>

                  <h3>7.3 Refunds and Cancellation</h3>
                  <p>
                    Refund policies are described in our billing terms. You may cancel your subscription at any time, with cancellation taking effect at the end of the current billing period.
                  </p>

                  <h2>8. Disclaimers and Limitations</h2>
                  
                  <h3>8.1 Service Availability</h3>
                  <p>
                    The Service is provided &ldquo;as is&rdquo; without warranties. We do not guarantee uninterrupted availability or error-free operation.
                  </p>

                  <h3>8.2 AI-Generated Content Disclaimer</h3>
                  <p>
                    AI-generated content may contain inaccuracies, biases, or unexpected results. Users are responsible for reviewing and validating generated content before use.
                  </p>

                  <h3>8.3 Limitation of Liability</h3>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, PIXOO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul>
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Damages arising from use of AI-generated content</li>
                    <li>Third-party claims related to generated content</li>
                    <li>Service interruptions or technical failures</li>
                  </ul>

                  <h2>9. Indemnification</h2>
                  <p>
                    You agree to indemnify and hold harmless Pixoo from any claims, damages, or expenses arising from:
                  </p>
                  <ul>
                    <li>Your use of the Service in violation of these Terms</li>
                    <li>Your generated content or its use</li>
                    <li>Infringement of third-party rights</li>
                    <li>Your breach of any representations or warranties</li>
                  </ul>

                  <h2>10. Privacy and Data Protection</h2>
                  <p>
                    Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                  </p>

                  <h2>11. International Use and Export Controls</h2>
                  <p>
                    The Service may be subject to export control laws. You agree to comply with all applicable laws regarding the transmission of technical data exported from your country of residence.
                  </p>

                  <h2>12. Dispute Resolution</h2>
                  
                  <h3>12.1 Governing Law</h3>
                  <p>
                    These Terms are governed by the laws of [Jurisdiction], without regard to conflict of law principles.
                  </p>

                  <h3>12.2 Arbitration</h3>
                  <p>
                    Any disputes arising under these Terms shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization].
                  </p>

                  <h2>13. Changes to Terms</h2>
                  <p>
                    We may modify these Terms at any time. Material changes will be communicated through the Service or via email. Continued use after changes constitutes acceptance of the modified Terms.
                  </p>

                  <h2>14. Termination</h2>
                  <p>
                    Either party may terminate this agreement at any time. Upon termination, your right to use the Service ceases immediately, though certain provisions will survive termination.
                  </p>

                  <h2>15. Severability</h2>
                  <p>
                    If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect.
                  </p>

                  <h2>16. Contact Information</h2>
                  <p>
                    For questions about these Terms, please contact us at:
                  </p>
                  <ul>
                    <li>Email: legal@pixoo.com</li>
                    <li>Address: [Company Address]</li>
                  </ul>

                  <h2>17. Entire Agreement</h2>
                  <p>
                    These Terms, together with our Privacy Policy and any additional terms for specific features, constitute the entire agreement between you and Pixoo regarding the Service.
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
