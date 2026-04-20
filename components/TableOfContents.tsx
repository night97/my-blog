'use client'

import { useState } from 'react'
import { ChevronDown, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TocItem } from '@/lib/toc'

interface TableOfContentsProps {
  toc: TocItem[]
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [open, setOpen] = useState(false)

  if (toc.length === 0) return null

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      // H5 点击后关闭菜单
      setOpen(false)
    }
  }

  // Web 端：侧边栏固定
  // H5 端：折叠弹出菜单
  return (
    <>
      {/* 移动端：折叠按钮 */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-left"
        >
          <List size={18} />
          <span className="font-medium text-gray-900 dark:text-white">文章目录</span>
          <ChevronDown
            size={18}
            className={cn(
              'ml-auto transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
        {open && (
          <nav className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <TocList toc={toc} onItemClick={handleClick} />
          </nav>
        )}
      </div>

      {/* 桌面端：固定侧边栏 */}
      <nav className="hidden lg:block fixed top-24 right-[max(0px,calc(50%-580px))] w-[220px] pr-8 max-h-[calc(100vh-100px)] overflow-auto">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
          目录
        </h4>
        <div className="border-l border-gray-200 dark:border-gray-700 pl-3">
          <TocList toc={toc} onItemClick={handleClick} />
        </div>
      </nav>
    </>
  )
}

function TocList({
  toc,
  onItemClick,
}: {
  toc: TocItem[]
  onItemClick: (id: string) => void
}) {
  return (
    <ul className="py-2">
      {toc.map((item) => (
        <li
          key={item.id}
          className={cn(
            'mb-1',
            item.depth === 1 ? 'ml-0' :
            item.depth === 2 ? 'ml-0' : `ml-${(item.depth - 2) * 4}`
          )}
        >
          <button
            onClick={() => onItemClick(item.id)}
            className={cn(
              'text-left hover:text-primary transition-colors block w-full px-3 py-1 rounded',
              item.depth <= 2
                ? 'text-sm font-medium text-gray-700 dark:text-gray-300'
                : 'text-xs text-gray-500 dark:text-gray-400'
            )}
          >
            {item.value}
          </button>
        </li>
      ))}
    </ul>
  )
}
