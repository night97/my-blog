import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    where: { published: true },
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">专栏</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        系统化的系列教程与专题研究，帮助你循序渐进学习
      </p>

      {collections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">暂无公开专栏</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {collections.map((collection: any) => (
            <Link
              key={collection.id}
              href={`/collection/${collection.slug}`}
              className="group"
            >
              <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-md">
                {collection.cover && (
                  <div className="relative w-full h-40 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={collection.cover}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>{collection._count.posts} 篇文章</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
