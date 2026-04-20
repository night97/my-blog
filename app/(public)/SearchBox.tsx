'use client'

import { Search, X } from 'lucide-react'

interface SearchBoxProps {
  query: string
  currentTagSlug: string
}

export default function SearchBox({ query, currentTagSlug }: SearchBoxProps) {
  return (
    <div className="mb-6">
      <form action="/" method="GET">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="搜索文章标题..."
            className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => window.location.href = '/' + (currentTagSlug ? `?tag=${currentTagSlug}` : '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {currentTagSlug && (
          <input type="hidden" name="tag" value={currentTagSlug} />
        )}
      </form>
    </div>
  )
}