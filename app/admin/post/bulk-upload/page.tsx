'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Switch from '@/components/ui/Switch'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const bulkUploadSchema = z.object({
  defaultPublished: z.boolean().default(false),
})

type BulkUploadFormData = z.infer<typeof bulkUploadSchema>

interface UploadResult {
  success: boolean
  total: number
  created: Array<{ id: number; title: string; slug: string }>
  errors: Array<{ filename: string; error: string }>
}

export default function BulkUploadPage() {
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { info, error } = useToast()

  const {
    register,
    watch,
    setValue,
  } = useForm<BulkUploadFormData>({
    defaultValues: {
      defaultPublished: false,
    },
    resolver: zodResolver(bulkUploadSchema),
  })

  const defaultPublished = watch('defaultPublished')

  // 处理文件添加
  const addFiles = useCallback((files: FileList) => {
    const mdFiles = Array.from(files).filter(
      f => f.name.endsWith('.md') || f.name.endsWith('.markdown')
    )
    if (mdFiles.length < files.length) {
      info('仅支持 .md 文件，已自动过滤非 Markdown 文件')
    }
    setSelectedFiles(prev => [...prev, ...mdFiles])
    setResult(null)
  }, [])

  // 拖放处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  // 点击选择文件
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
    // 重置 value 允许重复选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addFiles])

  // 移除文件
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setResult(null)
  }, [])

  // 清空列表
  const clearFiles = useCallback(() => {
    setSelectedFiles([])
    setResult(null)
  }, [])

  // 开始上传
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      info('请先选择文件')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('defaultPublished', String(defaultPublished))

      const res = await fetch('/api/posts/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setResult(data)
      if (data.success && data.created.length > 0) {
        // 成功后清空选择
        // setSelectedFiles([])
      }
    } catch (err) {
      error('网络错误，请重试')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        批量上传 Markdown
      </h1>

      <Card className="mb-6 p-6">
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            批量上传多个 Markdown 文件，自动创建文章。支持 YAML frontmatter 提取元数据。
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <strong>支持的 frontmatter 字段：</strong> title, excerpt, description, slug, published
          </div>
        </div>

        <div className="mb-4">
          <Switch
            label="默认发布"
            checked={defaultPublished}
            onChange={(v) => setValue('defaultPublished', v)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {defaultPublished
              ? '所有上传文章默认设为已发布'
              : '所有上传文章默认保存为草稿'}
          </p>
        </div>

        {/* 拖放区域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.markdown"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            拖拽 Markdown 文件到这里，或点击选择
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            仅支持 .md 文件
          </p>
        </div>

        {/* 已选文件列表 */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                已选择 {selectedFiles.length} 个文件
              </h3>
              <Button variant="outline" size="sm" onClick={clearFiles}>
                清空
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedFiles.map((file: File, index: number) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 上传按钮 */}
      <div className="flex gap-3 mb-8">
        <Button
          size="lg"
          disabled={selectedFiles.length === 0 || uploading}
          onClick={handleUpload}
          className="flex items-center gap-2"
        >
          <Upload size={18} />
          {uploading ? '上传中...' : `开始上传 (${selectedFiles.length})`}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/admin/dashboard')}
        >
          返回
        </Button>
      </div>

      {/* 上传结果 */}
      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            上传完成
          </h2>

          <div className="mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {result.total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">总计</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {result.created.length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">成功</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {result.errors.length}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">失败</div>
              </div>
            </div>
          </div>

          {/* 成功列表 */}
          {result.created.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                创建成功
              </h3>
              <div className="space-y-2">
                {result.created.map((post: any) => (
                  <div
                    key={post.id}
                    className="p-3 bg-green-50 dark:bg-green-900/10 rounded flex items-center justify-between"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {post.title}
                    </span>
                    <Link href={`/admin/post/${post.id}/edit`}>
                      <Button variant="outline" size="sm">
                        编辑
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 错误列表 */}
          {result.errors.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <XCircle size={18} className="text-red-600 dark:text-red-400" />
                处理失败
              </h3>
              <div className="space-y-2">
                {result.errors.map((err: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 dark:bg-red-900/10 rounded"
                  >
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {err.filename}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {err.error}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
