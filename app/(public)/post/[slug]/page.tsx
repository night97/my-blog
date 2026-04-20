import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { estimateReadTime, generateHeadingId } from '@/lib/utils'
import type { Components } from 'react-markdown'
import { Clock, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TableOfContents from '@/components/TableOfContents'
import { extractToc } from '@/lib/toc'

interface Props {
  params: { slug: string }
}

// 将 React children 提取为纯文本
function extractText(children: any): string {
  if (typeof children === 'string') {
    return children
  }
  if (Array.isArray(children)) {
    return children.map(extractText).join('')
  }
  if (typeof children === 'object' && children.props?.children) {
    return extractText(children.props.children)
  }
  return ''
}

interface CollectionInfo {
  id: number
  name: string
  slug: string
  position: number
  prevPost: { slug: string; title: string } | null
  nextPost: { slug: string; title: string } | null
}

export default async function PostPage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: {
      collections: {
        include: {
          collection: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  // 如果文章不存在或未发布，返回 404
  if (!post || !post.published) {
    notFound()
  }

  const readTime = estimateReadTime(post.content)
  const toc = extractToc(post.content)

  // 获取前后文章用于导航（按日期）
  // 自定义markdown组件样式，确保表格正确显示
  const markdownComponents: Partial<Components> = {
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto my-6">
        <table className="border-collapse table-auto w-full text-sm border border-gray-200 dark:border-gray-700">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border-b-2 border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">
        {children}
      </td>
    ),
    input: (props: any) => (
        <input
          {...props}
          className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          type="checkbox"
        />
    )
  } as any

  // 添加原有的标题处理逻辑
  markdownComponents.h1 = ({ node, ...props }: any) => {
    const text = extractText(props.children)
    const id = generateHeadingId(text)
    return <h1 id={id} {...props} className="dark:text-white" />
  }
  markdownComponents.h2 = ({ node, ...props }: any) => {
    const text = extractText(props.children)
    const id = generateHeadingId(text)
    return <h2 id={id} {...props} className="dark:text-white" />
  }
  markdownComponents.h3 = ({ node, ...props }: any) => {
    const text = extractText(props.children)
    const id = generateHeadingId(text)
    return <h3 id={id} {...props} className="dark:text-white" />
  }
  markdownComponents.h4 = ({ node, ...props }: any) => {
    const text = extractText(props.children)
    const id = generateHeadingId(text)
    return <h4 id={id} {...props} className="dark:text-white" />
  }
  markdownComponents.h5 = ({ node, ...props }: any) => {
    const text = extractText(props.children)
    const id = generateHeadingId(text)
    return <h5 id={id} {...props} className="dark:text-white" />
  }
  markdownComponents.h6 = ({ node, ...props }: any) => {
    const text = extractText(props.children)
    const id = generateHeadingId(text)
    return <h6 id={id} {...props} className="dark:text-white" />
  }

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, createdAt: { lt: post.createdAt } },
      orderBy: { createdAt: 'desc' },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { published: true, createdAt: { gt: post.createdAt } },
      orderBy: { createdAt: 'asc' },
      select: { slug: true, title: true },
    }),
  ])

  // 获取专栏信息和专栏内前后文章
  const collectionInfos: CollectionInfo[] = []
  for (const cp of post.collections) {
    if (!cp.collection.published) continue

    // 获取专栏所有已发布文章按顺序
    const allPostsInCollection = await prisma.collectionPost.findMany({
      where: {
        collectionId: cp.collection.id,
        post: { published: true },
      },
      include: { post: { select: { slug: true, title: true } } },
      orderBy: { position: 'asc' },
    })

    const currentIndex = allPostsInCollection.findIndex((p: any) => p.postId === post.id)
    const prevInCollection = currentIndex > 0 ? allPostsInCollection[currentIndex - 1].post : null
    const nextInCollection = currentIndex < allPostsInCollection.length - 1 ? allPostsInCollection[currentIndex + 1].post : null

    collectionInfos.push({
      id: cp.collection.id,
      name: cp.collection.name,
      slug: cp.collection.slug,
      position: cp.position,
      prevPost: prevInCollection,
      nextPost: nextInCollection,
    })
  }

  return (
    <div className="relative">
      <TableOfContents toc={toc} />
      <article className="max-w-[700px] mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight dark:text-white">
            {post.title}
          </h1>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <time dateTime={post.createdAt.toISOString()}>
                {format(new Date(post.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
              </time>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {readTime} 分钟阅读
              </span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: any) => (
                  <Link
                    key={tag.id}
                    href={`/?tag=${tag.slug}`}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:text-primary transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* 专栏信息横幅 */}
        {collectionInfos.length > 0 && (
          <div className="mb-8 space-y-3">
            {collectionInfos.map((collection: any) => (
              <div
                key={collection.id}
                className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg"
              >
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    本文章属于专栏：
                    <Link
                      href={`/collection/${collection.slug}`}
                      className="font-semibold hover:underline ml-1"
                    >
                      {collection.name}
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="prose max-w-none text-gray-700 text-lg leading-relaxed dark:text-gray-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </ReactMarkdown>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          {/* 专栏内导航 */}
          {collectionInfos.map((collection: any) => (
            (collection.prevPost || collection.nextPost) && (
              <div key={collection.id} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  专栏「{collection.name}」阅读顺序
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {collection.prevPost && (
                    <Link href={`/post/${collection.prevPost.slug}`} className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <ChevronLeft size={16} />
                        上一篇
                      </div>
                      <div className="font-medium text-gray-900 hover:text-primary transition-colors mt-1 dark:text-gray-100">
                        {collection.prevPost.title}
                      </div>
                    </Link>
                  )}
                  {collection.nextPost && (
                    <Link href={`/post/${collection.nextPost.slug}`} className={`flex-1 ${collection.prevPost ? 'text-right' : ''}`}>
                      <div className={`flex items-center ${collection.prevPost ? 'justify-end' : 'justify-start'} gap-2 text-sm text-gray-500 dark:text-gray-400`}>
                        {collection.prevPost ? '' : '下一篇'}
                        {collection.nextPost && !collection.prevPost ? null : null}
                        {!collection.prevPost ? '下一篇' : ''}
                        <ChevronRight size={16} />
                      </div>
                      <div className="font-medium text-gray-900 hover:text-primary transition-colors mt-1 dark:text-gray-100">
                        {collection.nextPost.title}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )
          ))}

          {/* 按日期导航 */}
          {(prevPost || nextPost) && (
            <div className="flex flex-col md:flex-row justify-between gap-4">
              {prevPost && (
                <Link href={`/post/${prevPost.slug}`} className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ChevronLeft size={16} />
                    上一篇（按时间）
                  </div>
                  <div className="font-medium text-gray-900 hover:text-primary transition-colors mt-1 dark:text-gray-100">
                    {prevPost.title}
                  </div>
                </Link>
              )}
              {nextPost && (
                <Link href={`/post/${nextPost.slug}`} className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                    下一篇（按时间）
                    <ChevronRight size={16} />
                  </div>
                  <div className="font-medium text-gray-900 hover:text-primary transition-colors mt-1 dark:text-gray-100">
                    {nextPost.title}
                  </div>
                </Link>
              )}
            </div>
          )}
        </footer>
      </article>
    </div>
  )
}

// 移除 generateStaticParams，改为动态渲染，避免构建时需要数据库连接
