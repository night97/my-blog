'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // 避免水合不匹配，初始不渲染
  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
      title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
