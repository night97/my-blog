import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { estimateReadTime } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { initDefaultAdmin } from '@/lib/auth'
import { cn } from '@/lib/utils'
import SearchBox from './SearchBox'
import './home.css'

// 初始化默认管理员
initDefaultAdmin().catch(console.error)

interface HomePageProps {
  searchParams: {
    q?: string
    tag?: string
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = searchParams.q || ''
  const currentTagSlug = searchParams.tag || ''

  // 获取所有已发布文章，包含标签
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  // 获取所有标签
  const allTags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  })

  // 过滤：关键词搜索标题 + 标签筛选
  const filteredPosts = posts.filter((post: any) => {
    const matchesQuery = !query || post.title.toLowerCase().includes(query.toLowerCase())
    const matchesTag = !currentTagSlug || post.tags.some((tag: any) => tag.slug === currentTagSlug)
    return matchesQuery && matchesTag
  })

  return (
    <div className="max-w-[700px] mx-auto">
      {/* 搜索框 - 客户端组件处理交互 */}
      <SearchBox query={query} currentTagSlug={currentTagSlug} />

      {/* 标签云 */}
      {allTags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className={cn(
                'px-3 py-1 rounded-full text-sm border transition-colors',
                !currentTagSlug
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary'
              )}
            >
              全部
            </Link>
            {allTags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/?tag=${tag.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                className={cn(
                  'px-3 py-1 rounded-full text-sm border transition-colors',
                  currentTagSlug === tag.slug
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary'
                )}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 文章列表 */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">
              {query || currentTagSlug ? '没有找到匹配的文章' : '暂无文章'}
            </p>
            {(query || currentTagSlug) && (
              <p className="text-gray-400 text-sm mt-2">
                <Link href="/" className="text-primary hover:underline">查看全部文章</Link>
              </p>
            )}
            {!query && !currentTagSlug && (
              <p className="text-gray-400 text-sm mt-2">
                前往 /admin/login 登录后添加第一篇文章吧
              </p>
            )}
          </Card>
        ) : (
          filteredPosts.map((post: any) => {
            const readTime = estimateReadTime(post.content)
            return (
              <Link key={post.id} href={`/post/${post.slug}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <time dateTime={post.createdAt.toISOString()}>
                        {format(new Date(post.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
                      </time>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {readTime} 分钟阅读
                      </span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.map((tag: any) => (
                          <Link
                            key={tag.id}
                            href={`/?tag=${tag.slug}`}
                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {post.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
