import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HydrationSuppressor from './components/HydrationSuppressor'
import FirebaseStatus from './components/FirebaseStatus'
import ToastNotificationSystem from './components/ToastNotification'
import { ThemeProvider } from './components/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Foundic Network',
  description: 'The Cleanest Space for Startup Founders - Updated',
  openGraph: {
    title: 'Foundic Network',
    description: 'The Cleanest Space for Startup Founders',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foundic Network',
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='8' y='8' width='16' height='16' rx='2' fill='%2314b8a6' transform='rotate(45 16 16)'/><path d='M12 10 L16 14 L20 10' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 22 L16 18 L20 22' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M10 12 L14 16 L10 20' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M22 12 L18 16 L22 20' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>" />
      </head>
      <body className={`${inter.className}`}>
        <HydrationSuppressor />
        <FirebaseStatus />
        <ErrorBoundary>
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
            <ToastNotificationSystem />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
} 