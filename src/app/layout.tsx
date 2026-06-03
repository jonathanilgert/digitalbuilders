import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/content";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Modern Websites & Online Stores`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "web design Calgary",
    "website development",
    "ecommerce",
    "UX design",
    "Framer",
    "Webflow",
    "Shopify",
  ],
  openGraph: {
    title: `${site.name} — Modern Websites & Online Stores`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Modern Websites & Online Stores`,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-ink text-fg">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
