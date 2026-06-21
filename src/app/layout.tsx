// Deployment Trigger: 2026-05-15 13:51
import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pillora | Hospital Portal",
    description: "Find verified blood donors in India, check hospital charges, and explore government health schemes. Pillora is your complete health-tech platform.",
    keywords: ["blood donor", "hospital information", "find blood donor India", "hospital charges", "government health schemes India"],
    alternates: {
        canonical: "https://www.pillora.in"
    },
    openGraph: {
        title: "Pillora | Hospital Portal",
        description: "Find verified blood donors in India, check hospital charges, and explore government health schemes. Pillora is your complete health-tech platform.",
        url: "https://www.pillora.in",
        siteName: "Pillora",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pillora | Hospital Portal",
        description: "Find verified blood donors in India, check hospital charges, and explore government health schemes.",
    },
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
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "MedicalOrganization",
        "name": "Pillora",
        "description": "Blood Connect and Hospital Info provider in Ahmedabad.",
        "url": "https://www.pillora.in",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Ahmedabad",
            "addressRegion": "Gujarat",
            "addressCountry": "IN"
        }
    };

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
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
                </ThemeProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}

