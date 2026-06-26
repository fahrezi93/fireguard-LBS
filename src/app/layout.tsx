import type { Metadata, Viewport } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.siagabencana-palembang.my.id'),
  title: {
    default: 'SiagaBencana Plaju Darat, Palembang - Sistem Cepat Tanggap Kebakaran',
    template: '%s | SiagaBencana Palembang'
  },
  description: 'SiagaBencana adalah sistem peringatan dini dan pelaporan kebakaran real-time untuk wilayah Plaju Darat, Palembang. Lindungi lingkungan Anda dengan respon cepat dan akurat.',
  applicationName: 'SiagaBencana Palembang',
  authors: [{ name: 'SiagaBencana Team', url: 'https://www.siagabencana-palembang.my.id' }],
  generator: 'Next.js',
  keywords: ['kebakaran', 'palembang', 'emergency', 'fire', 'report', 'pemadam', 'plaju', 'darurat', 'tanggap darurat', 'pemadam kebakaran palembang'],
  referrer: 'origin-when-cross-origin',
  creator: 'SiagaBencana Team',
  publisher: 'SiagaBencana Plaju Darat',
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
    title: 'SiagaBencana Plaju Darat, Palembang',
    description: 'Sistem Cepat Tanggap Kebakaran Plaju Darat, Palembang - Laporkan insiden secara instan.',
    url: 'https://www.siagabencana-palembang.my.id',
    siteName: 'SiagaBencana',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/Fireguardthumbnail.png',
        width: 1200,
        height: 630,
        alt: 'SiagaBencana Palembang Thumbnail',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SiagaBencana Plaju Darat, Palembang',
    description: 'Sistem Cepat Tanggap Kebakaran Real-time untuk wilayah Plaju.',
    creator: '@siagabencana_id',
    images: ['/Fireguardthumbnail.png'],
  },
  alternates: {
    canonical: '/',
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

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
