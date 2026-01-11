'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <Button
        aria-label="Toggle theme"
        className="relative overflow-hidden h-9 w-9 p-0 rounded-full flex items-center justify-center transition-colors duration-200 bg-gray-200 dark:bg-gray-800"
        size="icon"
        variant="ghost"
        disabled
      >
        <Sun className="h-5 w-5 opacity-50" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative overflow-hidden h-9 w-9 p-0 rounded-full flex items-center justify-center transition-colors duration-200 ${
        isDark
          ? 'bg-white text-black ring-1 ring-black/5 shadow-sm'
          : 'bg-black text-white ring-1 ring-white/10 shadow-sm'
      }`}
      size="icon"
      variant="ghost"
    >
      {/* Sun: warm yellow with soft warm glow */}
      <Sun
        className={`h-5 w-5 transition-transform duration-300 ${
          isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        } text-yellow-400`} 
        style={{ filter: isDark ? 'none' : 'drop-shadow(0 6px 14px rgba(255,160,40,0.18))' }}
      />

      {/* Moon: soft lunar blue glow (not green) */}
      <Moon
        className={`absolute h-5 w-5 transition-transform duration-300 ${
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
        } text-[##cfeffd]`}
        style={{ filter: isDark ? 'drop-shadow(0 6px 18px rgba(81,196,255,0.45))' : 'none' }}
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeToggle

