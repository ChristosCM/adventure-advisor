import type { Metadata } from "next";
import "./globals.css";

const title = "Adventure Advisor";
const description =
  "Best sport · best spot · best weather — find your ideal adventure for the upcoming weekend.";

// Absolute base for og:image URLs. WhatsApp and friends need a fully-qualified
// URL; this resolves from the deploy env, falling back to localhost in dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  // og:image is supplied automatically by app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    title,
    description,
    siteName: title,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

// Set the theme class before paint to avoid a flash of the wrong theme.
const noFlashTheme = `
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
