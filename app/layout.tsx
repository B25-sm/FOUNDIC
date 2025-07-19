import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthUser from './components/AuthUser';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Foundic - The Cleanest Space for Startup Founders',
  description: 'Connect with co-founders, join mission pods, and build your startup in the most trusted founder community. DNA matching, 60-day sprints, and investor connections.',
  keywords: 'startup, founders, co-founders, investors, mission pods, DNA matching, startup community',
  authors: [{ name: 'Foundic Team' }],
  creator: 'Foundic',
  publisher: 'Foundic',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://foundic.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Foundic - The Cleanest Space for Startup Founders',
    description: 'Connect with co-founders, join mission pods, and build your startup in the most trusted founder community.',
    url: 'https://foundic.com',
    siteName: 'Foundic',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Foundic - Startup Founder Community',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foundic - The Cleanest Space for Startup Founders',
    description: 'Connect with co-founders, join mission pods, and build your startup in the most trusted founder community.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dna-match', label: 'DNA Match' },
  { href: '/pods', label: 'Pods' },
  { href: '/wall', label: 'Wall' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/investors', label: 'Investors' },
  { href: '/admin', label: 'Admin' },
];

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-midnight-950/80 backdrop-blur-md border-b border-midnight-800 shadow-midnight-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2">
          <span className="text-gold-950 font-extrabold text-2xl tracking-tight">Foundic</span>
        </a>
        <div className="hidden md:flex gap-4">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="nav-link px-3 py-2 rounded-lg hover:bg-midnight-800 transition-colors duration-200">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <AuthUser />
        </div>
      </div>
    </nav>
  );
}

// Remove AuthGuard from layout, let client pages handle auth

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0F2C" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Foundic Team" />
        <meta name="application-name" content="Foundic" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Foundic" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0A0F2C" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${inter.className} antialiased bg-midnight-950 text-support pt-16`}>
        <Navbar />
        <Sidebar />
        <div id="root" className="lg:pl-64">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#E5E5E5',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#E5E5E5',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#E5E5E5',
              },
            },
          }}
        />
      </body>
    </html>
  );
} 