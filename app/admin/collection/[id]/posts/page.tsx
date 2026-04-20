'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface Post {
  id: number
  title: string
  published: boolean
  collectionPostId: number
  position: number
}

interface AllPost {
  id: number
  title: string
  published: boolean
}

interface Collection {
  id: number
  name: string
}

export default function CollectionPostsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [availablePosts, setAvailablePosts] = useState<AllPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const { error, success } = useToast()

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      // 获取专栏信息
      const collRes = await fetch(`/api/collections/${params.id}`)
      const collData = await collRes.json()
      setCollection(collData.collection)

      // 获取专栏中已有的文章
      const postsRes = await fetch(`/api/collections/${params.id}/posts`)
      const postsData = await postsRes.json()
      setPosts(postsData.posts)

      // 获取所有可选文章
      const allPostsRes = await fetch('/api/posts?admin=true')
      const allPostsData = await allPostsRes.json()
      const existingIds = new Set(postsData.posts.map((p: Post) => p.id))
      setAvailablePosts(allPostsData.posts.filter((p: AllPost) => !existingIds.has(p.id)))
    } catch (err) {
      console.error('加载数据失败', err)
    } finally {
      setLoading(false)
    }
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newPosts = [...posts]
    ;[newPosts[index], newPosts[index - 1]] = [newPosts[index - 1], newPosts[index]]
    setPosts(newPosts)
  }

  const moveDown = (index: number) => {
    if (index === posts.length - 1) return
    const newPosts = [...posts]
    ;[newPosts[index], newPosts[index + 1]] = [newPosts[index + 1], newPosts[index]]
    setPosts(newPosts)
  }

  const removePost = async (index: number, postId: number) => {
    const post = posts[index]
    if (!confirm(`确定要移除文章 "${post.title}" 吗？`)) return

    try {
      setSaving(true)
      const res = await fetch(`/api/collections/${params.id}/posts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', postId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        error(data.error || '移除失败')
      }
    } catch (err) {
      error('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const addPost = async (post: AllPost) => {
    try {
      setAdding(true)
      const res = await fetch(`/api/collections/${params.id}/posts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', postId: post.id }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        error(data.error || '添加失败')
      }
    } catch (err) {
      error('网络错误，请重试')
    } finally {
      setAdding(false)
    }
  }

  const saveOrder = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/collections/${params.id}/posts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: posts.map((p: any, i: number) => ({ ...p, position: i })) }),
      })
      const data = await res.json()
      if (data.success) {
        success('保存排序成功！')
        router.refresh()
      } else {
        error(data.error || '保存失败')
      }
    } catch (err) {
      error('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>
  }

  if (!collection) {
    return <div className="text-center py-8 text-gray-500">专栏不存在</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            管理文章：{collection.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            拖拽调整顺序不支持，使用上下按钮移动，保存后生效
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/collection/${collection.id}/edit`}>
            <Button variant="outline">编辑专栏信息</Button>
          </Link>
          <Link href="/admin/collection">
            <Button variant="outline">返回列表</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              当前文章 ({posts.length})
            </h2>

            {posts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 py-4">专栏还没有添加任何文章</p>
            ) : (
              <ul className="space-y-2">
                {posts.map((post: any, index: number) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center font-mono text-gray-400">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {post.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {post.published ? (
                            <span className="text-green-600 dark:text-green-400">已发布</span>
                          ) : (
                            <span className="text-yellow-600 dark:text-yellow-400">草稿</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === posts.length - 1}
                        className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removePost(index, post.id)}
                        disabled={saving}
                        className="px-2 py-1 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        移除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {posts.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={saveOrder} disabled={saving}>
                  {saving ? '保存中...' : '保存排序'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              添加文章
            </h2>

            {availablePosts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">没有可添加的文章了</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {availablePosts.map((post: any) => (
                  <li key={post.id} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {post.title}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {post.published ? '已发布' : '草稿'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addPost(post)}
                        disabled={adding}
                      >
                        添加
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
