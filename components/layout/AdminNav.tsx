'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListPlus, LogOut, BookOpen, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch('/api/login', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="font-bold text-gray-900 dark:text-white">
              管理后台
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/admin/post/new"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  pathname === '/admin/post/new'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <ListPlus size={16} />
                新建文章
              </Link>
              <Link
                href="/admin/collection"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  pathname.startsWith('/admin/collection')
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <BookOpen size={16} />
                专栏管理
              </Link>
              <Link
                href="/admin/post/bulk-upload"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  pathname === '/admin/post/bulk-upload'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <Upload size={16} />
                批量上传
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              退出
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
