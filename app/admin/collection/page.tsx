'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface Collection {
  id: number
  name: string
  slug: string
  description: string | null
  cover: string | null
  published: boolean
  createdAt: string
  _count: {
    posts: number
  }
}

export default function CollectionListPage() {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const { error, success } = useToast()

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections?admin=true')
      const data = await res.json()
      setCollections(data.collections)
    } catch (err) {
      console.error('获取列表失败', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除专栏 "${name}" 吗？此操作不可恢复。`)) return

    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        success('删除成功')
        fetchCollections()
      } else {
        error(data.error || '删除失败')
      }
    } catch (err) {
      error('网络错误，请重试')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">专栏管理</h1>
        <Link href="/admin/collection/new">
          <Button>新建专栏</Button>
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">还没有创建任何专栏</p>
          <Link href="/admin/collection/new">
            <Button>创建第一个专栏</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    文章数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {collections.map((collection: any) => (
                  <tr key={collection.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {collection.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {collection.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {collection._count.posts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          collection.published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {collection.published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(collection.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/collection/${collection.id}/posts`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                        >
                          文章
                        </Link>
                        <Link
                          href={`/admin/collection/${collection.id}/edit`}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(collection.id, collection.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
