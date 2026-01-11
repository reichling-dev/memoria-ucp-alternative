import '@/app/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import ThemeToggle from './components/theme-toggle'
import { SessionProvider } from "./components/providers/session-provider"
import { NotificationBell } from './components/admin-button'
import { initializeDataFiles } from '@/lib/init-data'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

import { applicationConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: applicationConfig.website.metaTitle,
  description: applicationConfig.website.metaDescription,
}

// Initialize data files on server startup
if (typeof window === 'undefined') {
  initializeDataFiles()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen bg-background text-foreground">
              {children}

              {/* Global theme toggle and notification bell: fixed top-right on every page */}
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

