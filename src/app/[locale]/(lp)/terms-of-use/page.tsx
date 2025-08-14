import { getTranslations } from 'next-intl/server'

import { PageContainer } from '@/components/ui/page-container'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'TermsOfUse' })
    return {
        title: t('title')
    }
}

export default async function TermsOfUsePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'TermsOfUse' })

    return (
        <PageContainer>
            <div className="mx-auto max-w-4xl space-y-8 py-12 lg:py-24">
                <div className="space-y-4 text-center">
                    <h1 className="text-4xl font-bold">{t('title')}</h1>
                    <p className="text-grafite-500">
                        {t('lastUpdated', { date: new Date() })}
                    </p>
                </div>

                <div className="prose prose-lg mx-auto max-w-full text-grafite-600 dark:prose-invert dark:text-grafite-400">
                    <h2>1. Agreement to Terms</h2>
                    <p>
                        By using our Application, you agree to be bound by these Terms of
                        Use. If you do not agree to these Terms of Use, you may not use the
                        Application. We may modify these Terms at any time, and such
                        modification shall be effective immediately upon posting of the
                        modified Terms.
                    </p>

                    <h2>2. Intellectual Property Rights</h2>
                    <p>
                        The Application and its entire contents, features, and
                        functionality (including but not limited to all information,
                        software, text, displays, images, video, and audio, and the
                        design, selection, and arrangement thereof) are owned by the
                        Company, its licensors, or other providers of such material and
                        are protected by international copyright, trademark, patent, trade
                        secret, and other intellectual property or proprietary rights
                        laws.
                    </p>

                    <h2>3. User Representations</h2>
                    <p>
                        By using the Site, you represent and warrant that: (1) all
                        registration information you submit will be true, accurate,
                        current, and complete; (2) you will maintain the accuracy of such
                        information and promptly update such registration information as
                        necessary; (3) you have the legal capacity and you agree to comply
                        with these Terms of Use; (4) you are not a minor in the
                        jurisdiction in which you reside; (5) you will not access the Site
                        through automated or non-human means, whether through a bot,
                        script or otherwise; (6) you will not use the Site for any illegal
                        or unauthorized purpose; and (7) your use of the Site will not
                        violate any applicable law or regulation.
                    </p>

                    <h2>4. Prohibited Activities</h2>
                    <p>
                        You may not access or use the Site for any purpose other than that
                        for which we make the Site available. The Site may not be used in
                        connection with any commercial endeavors except those that are
                        specifically endorsed or approved by us.
                    </p>

                    <h2>5. Term and Termination</h2>
                    <p>
                        These Terms of Use shall remain in full force and effect while you
                        use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS
                        OF USE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND
                        WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE
                        (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY
                        REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF
                        ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS
                        OF USE OR OF ANY APPLICABLE LAW OR REGULATION.
                    </p>

                    <h2>6. Governing Law</h2>
                    <p>
                        These Terms of Use and your use of the Site are governed by and
                        construed in accordance with the laws of the country where the
                        company is established, without regard to its conflict of law
                        principles.
                    </p>

                    <h2>7. Contact Us</h2>
                    <p>
                        In order to resolve a complaint regarding the Site or to receive
                        further information regarding use of the Site, please contact us
                        at: sac@moriz.ai
                    </p>
                </div>
            </div>
        </PageContainer>
    )
} 