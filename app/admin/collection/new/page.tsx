'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Switch from '@/components/ui/Switch'
import { Upload, X } from 'lucide-react'
import { generateSlug } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

const collectionSchema = z.object({
  name: z.string().min(1, '请输入专栏名称'),
  slug: z.string().min(1, '请输入链接别名'),
  description: z.string().optional(),
  cover: z.string().optional(),
  published: z.boolean().default(false),
})

type CollectionFormData = z.infer<typeof collectionSchema>

const DRAFT_KEY = 'blog_collection_draft_new'

export default function NewCollectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { error, success } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CollectionFormData>({
    defaultValues: {
      published: false,
      name: '',
      slug: '',
      description: '',
      cover: '',
    },
    resolver: zodResolver(collectionSchema),
  })

  const name = watch('name')
  const slug = watch('slug')
  const description = watch('description')
  const cover = watch('cover')
  const published = watch('published')

  // 检查并恢复草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (confirm('发现未保存的草稿，是否恢复？')) {
          setValue('name', draft.name || '')
          setValue('slug', draft.slug || '')
          setValue('description', draft.description || '')
          setValue('cover', draft.cover || '')
          setValue('published', draft.published || false)
        }
        setHasDraft(true)
      } catch (e) {
        console.error('恢复草稿失败', e)
      }
    }
  }, [setValue])

  // 自动保存草稿
  const saveDraft = useCallback(() => {
    if (!name && !description) return

    setAutoSaving(true)
    const draft = {
      name,
      slug,
      description,
      cover,
      published,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setTimeout(() => setAutoSaving(false), 1000)
  }, [name, slug, description, cover, published])

  // 防抖自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (name || description) {
        saveDraft()
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [name, slug, description, cover, published, saveDraft])

  // 当名称变化且 slug 为空时，自动生成 slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setValue('name', newName)
    if (!slug || slug === generateSlug(name || '')) {
      setValue('slug', generateSlug(newName))
    }
  }

  const onSubmit = async (data: CollectionFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        error(result.error || '创建失败')
        return
      }
      // 保存成功后清除草稿
      localStorage.removeItem(DRAFT_KEY)
      success('创建成功')
      router.push('/admin/collection')
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">新建专栏</h1>
        {(hasDraft || autoSaving) && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {autoSaving ? '自动保存中...' : '已自动保存到本地'}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              专栏名称
            </label>
            <Input
              {...register('name')}
              onChange={handleNameChange}
              placeholder="专栏名称"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="static">链接别名 (Slug)
            </label>
            <Input
              {...register('slug')}
              placeholder="collection-slug"
              className={errors.slug ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              用于生成专栏链接：/collection/your-slug，自动从名称生成，可手动修改
            </p>
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              专栏描述
            </label>
            <Textarea
              {...register('description')}
              placeholder="介绍这个专栏是讲什么的（可选）"
              minRows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              封面图片
            </label>
            <div className="flex gap-2">
              <Input
                {...register('cover')}
                placeholder="https://example.com/cover.jpg，或点击右侧上传"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadingCover}
                onClick={() => fileInputRef.current?.click()}
                className="whitespace-nowrap"
              >
                <Upload size={16} className="mr-1" />
                {uploadingCover ? '上传中...' : '本地上传'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              专栏列表页会显示封面，留空不显示
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                setUploadingCover(true)
                try {
                  const formData = new FormData()
                  formData.append('file', file)

                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error)

                  setValue('cover', data.url)
                  success('上传成功')
                } catch (err) {
                  error(err instanceof Error ? err.message : '上传失败')
                } finally {
                  setUploadingCover(false)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }
              }}
              className="hidden"
            />
          </div>

          <div>
            Switch
            <Switch
              label="发布专栏"
              checked={published}
              onChange={(v) => setValue('published', v)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {published ? '专栏会公开显示在前台' : '保存为草稿，不对外公开'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? '保存中...' : '创建专栏'}
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
