// Deployment Trigger: 2026-05-15 13:51
import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE } from "@/lib/seo";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/structuredData";
import VoiceDemoWidget from "@/components/VoiceDemoWidget";

const inter = Inter({ subsets: ["latin"] });

// GA4 + Search Console come from env vars, never hard-coded.
// TODO(analytics): set NEXT_PUBLIC_GA4_ID to the pillorahospital.in GA4 property
// (a separate ID from www.pillora.in) in Vercel. Until then GA4 is simply off.
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const GSC_TOKEN = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
    metadataBase: new URL(SITE.url),
    // No canonical here on purpose: a root-layout canonical is inherited by every
    // page (it pointed the whole site at www.pillora.in). Pages set their own.
    title: {
        default: "Hospital Appointment Booking Software for India | Pillora",
        template: "%s | Pillora for Hospitals",
    },
    description:
        "Pillora helps hospitals, clinics and doctors take online appointments, manage walk-ins and organise doctor slots from one dashboard. Request a demo.",
    openGraph: {
        siteName: SITE.name,
        locale: SITE.locale,
        type: "website",
        images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: "Pillora for Hospitals" }],
    },
    twitter: {
        card: "summary_large_image",
        images: [SITE.ogImage],
    },
    ...(GSC_TOKEN ? { verification: { google: GSC_TOKEN } } : {}),
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },
    manifest: "/site.webmanifest",
    appleWebApp: {
        title: "Pillora",
        statusBarStyle: "default",
        capable: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
            </head>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Navbar />
                    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                        {children}
                    </div>
                    <Footer />
                    {/* AI receptionist voice demo; hidden unless NEXT_PUBLIC_VOICE_DEMO_URL is set */}
                    <VoiceDemoWidget />
                </ThemeProvider>
                <Analytics />
                <SpeedInsights />
                {GA4_ID && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
                            strategy="afterInteractive"
                        />
                        <Script id="google-analytics" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${GA4_ID}');
                            `}
                        </Script>
                    </>
                )}
            </body>
        </html>
    );
}
