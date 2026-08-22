import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  // Only load 3 weights instead of 5 — cuts woff2 file significantly
  weight: ['400', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  preload: true,
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.siagabencana.cloud'),
  title: {
    default: 'SiagaBencana Kecamatan Plaju - Sistem Cepat Tanggap Kebakaran',
    template: '%s | SiagaBencana Plaju'
  },
  description: 'SiagaBencana adalah sistem peringatan dini dan pelaporan kebakaran real-time untuk wilayah Kecamatan Plaju. Lindungi lingkungan Anda dengan respon cepat dan akurat.',
  applicationName: 'SiagaBencana Plaju',
  authors: [{ name: 'SiagaBencana Team', url: 'https://www.siagabencana.cloud' }],
  generator: 'Next.js',
  keywords: ['kebakaran', 'plaju', 'emergency', 'fire', 'report', 'pemadam', 'darurat', 'tanggap darurat', 'pemadam kebakaran plaju'],
  referrer: 'origin-when-cross-origin',
  creator: 'SiagaBencana Team',
  publisher: 'SiagaBencana Kecamatan Plaju',
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json', // Basic manifest for SEO/icons
  openGraph: {
    title: 'SiagaBencana Kecamatan Plaju',
    description: 'Sistem Cepat Tanggap Kebakaran Kecamatan Plaju - Laporkan insiden secara instan.',
    url: 'https://www.siagabencana.cloud',
    siteName: 'SiagaBencana',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/SiagaBencanathumbnail.png',
        width: 1200,
        height: 630,
        alt: 'SiagaBencana Plaju Thumbnail',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SiagaBencana Kecamatan Plaju',
    description: 'Sistem Cepat Tanggap Kebakaran Real-time untuk wilayah Plaju.',
    creator: '@siagabencana_id',
    images: ['/SiagaBencanathumbnail.png'],
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'fQMAihC6JgRodgSytxaQprMF5VOvcUbJwNWUex0BVdI',
  },
  category: 'emergency service',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#9F1C19',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>

          {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload hero image (LCP element) with high priority */}
        <link
          rel="preload"
          as="image"
          href="/bg1-mobile.webp"
          type="image/webp"
          // @ts-ignore
          fetchpriority="high"
          media="(max-width: 828px)"
        />
        <link
          rel="preload"
          as="image"
          href="/bg1-desktop.webp"
          type="image/webp"
          // @ts-ignore
          fetchpriority="high"
          media="(min-width: 829px)"
        />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
