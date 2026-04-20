'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/collections', label: '专栏' },
    { href: '/about', label: '关于' },
    { href: '/admin/dashboard', label: '管理' },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-primary transition-colors dark:text-white">
            Minimal Blog
          </Link>

          {/* 桌面端导航 - Web: 顶部导航，H5: 隐藏（改用底栏）*/}
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-gray-600 dark:text-gray-300'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pl-2 border-l border-gray-200 dark:border-gray-700">
              <ThemeToggle />
            </div>
          </nav>
          {/* 移动端显示主题切换 */}
          <div className="md:flex items-center hidden">
            <ThemeToggle />
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
