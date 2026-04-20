'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Info, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

// H5 移动端底部标签栏 - 符合单手操作设计
export default function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/about', label: '关于', icon: Info },
    { href: '/admin/dashboard', label: '管理', icon: Settings },
  ]

  // 只在移动端显示
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] py-1',
                isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* 留出底部安全区域 */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-900" />
    </nav>
  )
}
