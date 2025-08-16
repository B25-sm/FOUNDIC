import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HydrationSuppressor from './components/HydrationSuppressor'
import FirebaseStatus from './components/FirebaseStatus'
import { ThemeProvider } from './components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Foundic',
  description: 'The Cleanest Space for Startup Founders',
  openGraph: {
    title: 'Foundic',
    description: 'The Cleanest Space for Startup Founders',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foundic',
    description: 'The Cleanest Space for Startup Founders',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='goldGradient' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23F59E0B;stop-opacity:1' /><stop offset='100%' style='stop-color:%23D97706;stop-opacity:1' /></linearGradient></defs><circle cx='16' cy='16' r='15' fill='url(%23goldGradient)' stroke='%2392400E' stroke-width='1'/><rect x='10' y='8' width='12' height='2' fill='%230F172A'/><rect x='10' y='12' width='8' height='2' fill='%230F172A'/><rect x='10' y='18' width='8' height='2' fill='%230F172A'/></svg>" />
      </head>
      <body className={`${inter.className}`}>
        <HydrationSuppressor />
        <FirebaseStatus />
        <ThemeProvider>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-64">
              <Navbar />
              <main className="flex-1 overflow-auto pt-16">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
} 