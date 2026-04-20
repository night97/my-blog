'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Edit, Trash2, Plus, CheckCircle, XCircle, Download, Upload, Eye, X } from 'lucide-react'
import JSZip from 'jszip'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import type { Components } from 'react-markdown'

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

interface PostDetail extends Post {
  content: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [currentPreviewPost, setCurrentPreviewPost] = useState<PostDetail | null>(null)
  const [search, setSearch] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)
  const { error, success } = useToast()

  // 自定义markdown组件样式
  const markdownComponents: Partial<Components> = {
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-6">
        <table {...props} className="border-collapse table-auto w-full text-sm border border-gray-200 dark:border-gray-700">
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead {...props} className="bg-gray-50 dark:bg-gray-800">{children}</thead>
    ),
    th: ({ children, ...props }: any) => (
      <th {...props} className="border-b-2 border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td {...props} className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">
        {children}
      </td>
    ),
    input: (props: any) => (
      <input
        {...props}
        className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        type="checkbox"
      />
    ),
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // 批量导出所有文章为ZIP压缩包
  const handleBulkExport = async () => {
    if (posts.length === 0) {
      error('没有文章可导出')
      return
    }

    setExporting(true)
    try {
      // 获取所有文章的完整内容
      const zip = new JSZip()
      const date = new Date()
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`
      
      // 逐个获取文章内容并添加到zip
      for (const post of posts) {
        try {
          const res = await fetch(`/api/posts/${post.id}`)
          const data = await res.json()
          if (res.ok && data.post) {
            // 使用slug作为文件名，确保安全
            let filename = post.slug.replace(/[<>:"/\\|?*]/g, '-')
            if (!filename.endsWith('.md')) {
              filename += '.md'
            }
            // 添加frontmatter元数据
            let content = ''
            content += `---\n`
            content += `title: "${post.title.replace(/"/g, '\\"')}"\n`
            content += `slug: ${post.slug}\n`
            content += `published: ${post.published}\n`
            content += `created_at: ${post.createdAt}\n`
            content += `updated_at: ${post.updatedAt}\n`
            if (post.excerpt) {
              content += `excerpt: "${post.excerpt.replace(/"/g, '\\"')}"\n`
            }
            content += `---\n\n`
            content += data.post.content
            zip.file(filename, content)
          }
        } catch (err) {
          console.error(`获取文章 ${post.id} 失败`, err)
        }
      }

      // 生成并下载zip
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `blog-export-${timestamp}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      success(`成功导出 ${zip.filter(() => true).length} 篇文章到压缩包`)
    } catch (err) {
      console.error('导出失败', err)
      error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  // 批量导入ZIP压缩包中的markdown文件
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      error('请选择ZIP压缩包文件')
      return
    }

    setImporting(true)
    try {
      const zip = await JSZip.loadAsync(file)
      let importedCount = 0
      let failedCount = 0

      // 遍历zip中的所有文件
      for (const filename of Object.keys(zip.files)) {
        // 跳过目录和非md文件
        if (zip.files[filename].dir || !filename.match(/\.(md|markdown)$/i)) {
          continue
        }

        try {
          // 读取文件内容
          const content = await zip.files[filename].async('string')
          
          // 解析frontmatter
          let title = ''
          let slug = ''
          let excerpt = ''
          let published = false
          let body = content

          // 检查是否有frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1]
            body = frontmatterMatch[2]
            
            // 解析元数据
            const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/)
            const slugMatch = frontmatter.match(/slug:\s*(\S+)/)
            const excerptMatch = frontmatter.match(/excerpt:\s*["']?([^"'\n]+)["']?/)
            const publishedMatch = frontmatter.match(/published:\s*(true|false)/)
            
            if (titleMatch) title = titleMatch[1]
            if (slugMatch) slug = slugMatch[1]
            if (excerptMatch) excerpt = excerptMatch[1]
            if (publishedMatch) published = publishedMatch[1] === 'true'
          }

          // 如果没有title从文件名获取
          if (!title) {
            title = filename.replace(/\.(md|markdown)$/i, '').replace(/-/g, ' ')
          }

          // 如果没有slug从title生成
          if (!slug) {
            slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }

          // 先检查slug是否已经存在
          const checkRes = await fetch('/api/posts?admin=true')
          const checkData = await checkRes.json()
          const slugExists = checkData.posts.some((p: any) => p.slug === slug)
          
          if (slugExists) {
            console.log(`跳过导入：slug ${slug} 已存在`)
            failedCount++
            continue
          }

          // 创建文章
          const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              slug,
              excerpt: excerpt || undefined,
              content: body.trim(),
              published,
              tagIds: [],
            }),
          })

          if (res.ok) {
            importedCount++
          } else {
            failedCount++
          }
        } catch (err) {
          console.error(`导入文件 ${filename} 失败`, err)
          failedCount++
        }
      }

      // 刷新列表
      await fetchPosts()
      
      if (importedCount > 0) {
        success(`成功导入 ${importedCount} 篇文章${failedCount > 0 ? `，${failedCount} 篇失败` : ''}`)
      } else {
        error('没有找到可导入的markdown文件')
      }
    } catch (err) {
      console.error('导入失败', err)
      error('导入失败，请检查文件格式并重试')
    } finally {
      setImporting(false)
      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    }
  }

  // 打开预览弹窗
  const handleOpenPreview = async (post: Post) => {
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`)
      const data = await res.json()
      if (res.ok && data.post) {
        setCurrentPreviewPost(data.post)
        setPreviewModalOpen(true)
      } else {
        error(data.error || '获取文章内容失败')
      }
    } catch (err) {
      console.error('预览加载失败', err)
      error('网络错误，无法加载预览')
    } finally {
      setPreviewLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts?admin=true')
      const data = await res.json()
      setPosts(data.posts)
    } catch (err) {
      console.error('获取文章列表失败', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    setDeletingId(id)
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      setPosts(posts.filter(p => p.id !== id))
    } catch (err) {
      error('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

  // 搜索过滤
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">加载中...</div>
    )
  }

  return (
    <div>
      {/* 快捷操作卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">文章</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                管理所有博客文章
              </p>
            </div>
            <Link href="/admin/post/new">
              <Button>新建文章</Button>
            </Link>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">专栏</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                管理系列专题专栏
              </p>
            </div>
            <Link href="/admin/collection">
              <Button>专栏管理</Button>
            </Link>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">导入</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                批量上传 Markdown 文件
              </p>
            </div>
            <Link href="/admin/post/bulk-upload">
              <Button>批量上传</Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
        <div className="w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文章标题..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleBulkExport}
            disabled={exporting || posts.length === 0}
          >
            <Download size={18} />
            {exporting ? '导出中...' : '一键导出'}
          </Button>
          <label className="inline-block cursor-pointer">
            <input
              ref={importInputRef}
              type="file"
              accept=".zip"
              onChange={handleBulkImport}
              className="hidden"
            />
            <span className="inline-block">
              <Button
                variant="outline"
                className="flex items-center gap-2 pointer-events-none"
                disabled={importing}
              >
                <Upload size={18} />
                {importing ? '导入中...' : '一键导入'}
              </Button>
            </span>
          </label>
          <Link href="/admin/post/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              新建文章
            </Button>
          </Link>
        </div>
      </div>

      {/* 桌面端：表格布局 - Web 端信息密度更高 */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  还没有文章，点击右上角新建一篇吧
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{post.title}</div>
                    {post.excerpt && (
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {post.excerpt}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <CheckCircle size={12} />
                        已发布
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        <XCircle size={12} />
                        草稿
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(post.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleOpenPreview(post)}
                      >
                        <Eye size={14} />
                        预览
                      </Button>
                      <Link href={`/admin/post/${post.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Edit size={14} />
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {deletingId === post.id ? '删除中...' : '删除'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 移动端：卡片列表 - H5 端更适合触摸操作，增大点击热区 */}
      <div className="md:hidden space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            {search ? '没有找到匹配的文章' : '还没有文章，点击下方新建按钮添加文章'}
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                  {post.title}
                </h3>
                {post.published ? (
                  <span className="shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    已发布
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    草稿
                  </span>
                )}
              </div>
              {post.excerpt && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
              )}
              <div className="text-xs text-gray-400 mb-4">
                {format(new Date(post.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 w-full flex items-center justify-center gap-1"
                  onClick={() => handleOpenPreview(post)}
                >
                  <Eye size={14} />
                  预览
                </Button>
                <Link href={`/admin/post/${post.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1">
                    <Edit size={14} />
                    编辑
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  {deletingId === post.id ? '删除中' : '删除'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 预览弹窗 */}
      {previewModalOpen && currentPreviewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {currentPreviewPost.title}
                </h2>
                {currentPreviewPost.excerpt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentPreviewPost.excerpt}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setPreviewModalOpen(false)
                  setCurrentPreviewPost(null)
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="关闭预览"
              >
                <X size={20} />
              </button>
            </div>

            {/* 弹窗内容 - 预览 */}
            <div className="overflow-y-auto p-6 flex-1">
              {previewLoading ? (
                <div className="text-center py-12 text-gray-500">加载中...</div>
              ) : (
                <article className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {currentPreviewPost.content}
                  </ReactMarkdown>
                </article>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              {currentPreviewPost.published && (
                <Link href={`/post/${currentPreviewPost.slug}`} target="_blank">
                  <Button variant="outline">在新页面打开</Button>
                </Link>
              )}
              <Button
                onClick={() => {
                  setPreviewModalOpen(false)
                  setCurrentPreviewPost(null)
                }}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 移动端新建文章浮动按钮 */}
      <div className="md:hidden fixed right-6 bottom-24 z-10">
        <Link href="/admin/post/new">
          <Button size="lg" className="rounded-full w-14 h-14 p-0 shadow-lg flex items-center justify-center">
            <Plus size={24} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
