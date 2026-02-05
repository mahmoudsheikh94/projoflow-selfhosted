import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { appConfig } from "@/lib/config/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${appConfig.name} | AI-Powered Project Management`,
  description: "The first PM tool your AI can control. Built on MCP for agencies, consultancies, and dev teams. White-label ready, client portals, time tracking.",
  keywords: ["project management", "AI", "MCP", "Model Context Protocol", "agencies", "white-label", "client portal", "time tracking"],
  authors: [{ name: "Z-Flow" }],
  openGraph: {
    title: `${appConfig.name} - AI-Powered Project Management`,
    description: "The first PM tool your AI assistant can control through MCP. Built for agencies.",
    url: appConfig.url,
    siteName: appConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appConfig.name} - AI-Powered Project Management`,
    description: "The first PM tool your AI can control. Built on MCP.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent FOUC — reads localStorage before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('projoflow-theme-mode') || 'dark';
                  var resolved = mode;
                  if (mode === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (resolved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
