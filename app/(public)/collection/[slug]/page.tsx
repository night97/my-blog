import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await prisma.collection.findUnique({
    where: { slug: params.slug },
  })

  if (!collection || !collection.published) {
    return {
      title: '专栏不存在',
    }
  }

  return {
    title: `${collection.name}`,
    description: collection.description || `${collection.name} - 专栏`,
  }
}

export default async function CollectionPage({ params }: Props) {
  const collection = await prisma.collection.findUnique({
    where: { slug: params.slug },
    include: {
      posts: {
        include: {
          post: true,
        },
        orderBy: {
          position: 'asc',
        },
      },
    },
  })

  if (!collection || !collection.published) {
    notFound()
  }

  const posts = collection.posts.map((cp: any) => cp.post).filter((post: any) => post.published)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 专栏信息 */}
      <div className="mb-10 pb-6 border-b border-gray-200 dark:border-gray-700">
        {collection.cover && (
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={collection.cover}
              alt={collection.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {collection.description}
          </p>
        )}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          共 {posts.length} 篇文章
        </div>
      </div>

      {/* 文章列表 */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            该专栏暂无已发布文章
          </p>
        ) : (
          posts.map((post: any, index: number) => (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
