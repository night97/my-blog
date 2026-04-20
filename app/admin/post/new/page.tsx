'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Switch from '@/components/ui/Switch'
import MarkdownEditor from '@/components/editor/MarkdownEditor'
import { generateSlug, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

const postSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  slug: z.string().min(1, '请输入链接别名'),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
  content: z.string().min(1, '请输入内容'),
  tagIds: z.array(z.number()).optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface Tag {
  id: number
  name: string
  slug: string
}

const DRAFT_KEY = 'blog_post_draft_new'

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const { error, success } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    defaultValues: {
      published: false,
      content: '',
      title: '',
      slug: '',
      excerpt: '',
    },
    resolver: zodResolver(postSchema),
  })

  const title = watch('title')
  const slug = watch('slug')
  const excerpt = watch('excerpt')
  const published = watch('published')
  const content = watch('content')

  // 检查并恢复草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (confirm('发现未保存的草稿，是否恢复？')) {
          setValue('title', draft.title || '')
          setValue('slug', draft.slug || '')
          setValue('excerpt', draft.excerpt || '')
          setValue('content', draft.content || '')
          setValue('published', draft.published || false)
          if (draft.tagIds) {
            setSelectedTagIds(draft.tagIds || [])
          }
        }
        setHasDraft(true)
      } catch (e) {
        console.error('恢复草稿失败', e)
      }
    }
  }, [setValue])

  // 加载所有标签
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags')
        const data = await res.json()
        setAllTags(data.tags || [])
      } catch (err) {
        console.error('加载标签失败', err)
      }
    }
    fetchTags()
  }, [])

  // 自动保存草稿
  const saveDraft = useCallback(() => {
    if (!title && !content) return

    setAutoSaving(true)
    const draft = {
      title,
      slug,
      excerpt,
      content,
      published,
      tagIds: selectedTagIds,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setTimeout(() => setAutoSaving(false), 1000)
  }, [title, slug, excerpt, content, published, selectedTagIds])

  // 防抖自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        saveDraft()
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, slug, excerpt, content, published, saveDraft])

  // 当标题变化且 slug 为空时，自动生成 slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setValue('title', newTitle)
    if (!slug || slug === generateSlug(title || '')) {
      setValue('slug', generateSlug(newTitle))
    }
  }

  // 创建新标签
  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return

    setCreatingTag(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        error(data.error || '创建标签失败')
        return
      }
      setAllTags([...allTags, data.tag])
      setSelectedTagIds([...selectedTagIds, data.tag.id])
      setNewTagName('')
      success(`标签 "${name}" 创建成功`)
    } catch (err) {
      error('网络错误，请重试')
    } finally {
      setCreatingTag(false)
    }
  }

  // 切换标签选择
  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

  // 生成不重复的slug
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    // 获取现有文章列表
    const res = await fetch('/api/posts?admin=true')
    const data = await res.json()
    const existingSlugs = data.posts.map((p: any) => p.slug)
    
    let candidate = baseSlug
    let counter = 0
    // 如果slug已存在，添加随机字符串后缀
    while (existingSlugs.includes(candidate)) {
      const randomStr = Math.random().toString(36).substring(2, 8)
      candidate = `${baseSlug}-${randomStr}`
      counter++
      if (counter > 10) break
    }
    return candidate
  }

  const onSubmit = async (data: PostFormData) => {
    setLoading(true)
    try {
      // 检查slug是否重复，如果重复自动生成唯一slug
      const uniqueSlug = await generateUniqueSlug(data.slug)
      if (uniqueSlug !== data.slug) {
        setValue('slug', uniqueSlug)
        data.slug = uniqueSlug
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tagIds: selectedTagIds }),
      })
      const result = await res.json()
      if (!res.ok) {
        error(result.error || '创建失败')
        return
      }
      // 保存成功后清除草稿
      localStorage.removeItem(DRAFT_KEY)
      success('创建成功')
      router.push('/admin/dashboard')
      router.refresh()
    } catch (err) {
      error('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const clearDraft = () => {
    if (confirm('确认清除本地草稿吗？')) {
      localStorage.removeItem(DRAFT_KEY)
      setHasDraft(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新建文章</h1>
        {(hasDraft || autoSaving) && (
          <span className="text-sm text-gray-500">
            {autoSaving ? '自动保存中...' : '已自动保存到本地'}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题
            </label>
            <Input
              {...register('title')}
              onChange={handleTitleChange}
              placeholder="文章标题"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              链接别名 (Slug)
            </label>
            <Input
              {...register('slug')}
              placeholder="article-title"
              className={errors.slug ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              用于生成文章链接：/post/your-slug，自动从标题生成，可手动修改
            </p>
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              摘要
            </label>
            <Textarea
              {...register('excerpt')}
              placeholder="文章摘要，会显示在列表页（可选）"
              minRows={2}
            />
          </div>

          <div>
            <Switch
              label="发布文章"
              checked={published}
              onChange={(v) => setValue('published', v)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {published ? '文章会公开显示在前台' : '保存为草稿，不对外公开'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签
          </label>
          <div className="space-y-3">
            {/* 现有标签选择 */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag: any) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm border transition-colors',
                      selectedTagIds.includes(tag.id)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-primary'
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            {/* 创建新标签 */}
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入新标签名称"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={creatingTag || !newTagName.trim()}
                onClick={handleCreateTag}
              >
                {creatingTag ? '创建中...' : '创建标签'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            点击标签选中/取消选中，可以创建新标签
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容
          </label>
          <MarkdownEditor
            value={content || ''}
            onChange={(v) => setValue('content', v)}
            onSave={handleSubmit(onSubmit)}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? '保存中...' : '保存文章'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            取消
          </Button>
          {hasDraft && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={clearDraft}
            >
              清除草稿
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
