'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Textarea from '../ui/Textarea'
import { cn } from '@/lib/utils'
import { Image, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link, Code, Maximize2, Minimize2, LayoutGrid, Download, Upload, Quote, Table, CheckSquare, Minus } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import type { Components } from 'react-markdown'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSave?: () => void
}

// 计算字数（中文按字，英文按单词）
const countWords = (text: string): number => {
  if (!text) return 0
  // 去掉空白字符
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return 0
  // 统计中文字符 + 英文单词
  const chineseChars = clean.match(/[\u4e00-\u9fa5]/g)?.length || 0
  const englishWords = clean.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean).length
  return chineseChars + englishWords
}

// 预估阅读时间（分钟）
const estimateReadTime = (words: number): number => {
  // 中文阅读速度约 300 字/分钟，最少 1 分钟
  return Math.max(1, Math.ceil(words / 300))
}

export default function MarkdownEditor({ value, onChange, placeholder, onSave }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const scrollSyncRef = useRef(false)
  const { error, success } = useToast()

  const wordCount = countWords(value)
  const readTime = estimateReadTime(wordCount)

  // 在光标位置插入文本
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newValue)

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault()
          if (onSave) onSave()
          break
        case 'b':
          e.preventDefault()
          insertText('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertText('*', '*')
          break
        case 'k':
          e.preventDefault()
          insertText('[', '](url)')
          break
      }
    }
  }

  // 同步滚动
  const handleScroll = useCallback(() => {
    if (mode !== 'split' || !textareaRef.current || !previewRef.current || scrollSyncRef.current) return

    scrollSyncRef.current = true
    const textarea = textareaRef.current
    const preview = previewRef.current

    if (textarea.scrollHeight <= textarea.clientHeight) return

    const ratio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)

    requestAnimationFrame(() => {
      scrollSyncRef.current = false
    })
  }, [mode])

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 插入图片Markdown
      insertText(`![${file.name}](${data.url})`)
    } catch (err) {
      error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 一键导出为Markdown文件
  const handleExport = () => {
    if (!value.trim()) {
      error('没有内容可导出')
      return
    }

    // 获取标题作为文件名，如果没有标题则使用默认名称
    const firstLine = value.split('\n')[0]
    let filename = firstLine.replace(/^#\s*/, '').trim() || 'exported-markdown'
    if (!filename.endsWith('.md')) {
      filename += '.md'
    }

    const blob = new Blob([value], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 一键导入Markdown文件
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查是否是markdown文件
    const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.type === 'text/markdown'
    if (!isMarkdown) {
      error('请选择Markdown文件 (.md 或 .markdown)')
      return
    }

    setImporting(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        if (value.trim()) {
          if (!confirm('当前编辑器已有内容，导入会覆盖现有内容，是否继续？')) {
            if (importFileInputRef.current) {
              importFileInputRef.current.value = ''
            }
            setImporting(false)
            return
          }
        }
        onChange(content)
        success(`成功导入文件: ${file.name}`)
      } catch (err) {
        error('导入失败，请重试')
      } finally {
        setImporting(false)
        if (importFileInputRef.current) {
          importFileInputRef.current.value = ''
        }
      }
    }
    reader.onerror = () => {
      error('读取文件失败')
      setImporting(false)
      if (importFileInputRef.current) {
        importFileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // 自定义markdown组件样式，确保表格正确显示
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
    // 也优化任务列表显示
    input: (props: any) => (
      <input
        {...props}
        className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        type="checkbox"
      />
    ),
  }

  const tools = [
    { icon: Heading1, label: '一级标题', action: () => insertText('# ') },
    { icon: Heading2, label: '二级标题', action: () => insertText('## ') },
    { icon: Heading3, label: '三级标题', action: () => insertText('### ') },
    { divider: true },
    { icon: Bold, label: '粗体 ⌘B', action: () => insertText('**', '**') },
    { icon: Italic, label: '斜体 ⌘I', action: () => insertText('*', '*') },
    { icon: Quote, label: '块引用', action: () => insertText('> ') },
    { icon: Code, label: '代码块', action: () => insertText('```\n', '\n```') },
    { divider: true },
    { icon: List, label: '无序列表', action: () => insertText('- ') },
    { icon: ListOrdered, label: '有序列表', action: () => insertText('1. ') },
    { icon: CheckSquare, label: '任务列表', action: () => insertText('- [ ] ') },
    { divider: true },
    { icon: Table, label: '表格', action: () => insertText('| 表头1 | 表头2 |\n| --- | --- |\n| 内容1 | 内容2 |\n') },
    { icon: Minus, label: '水平线', action: () => insertText('\n---\n') },
    { divider: true },
    { icon: Link, label: '链接 ⌘K', action: () => insertText('[', '](url)') },
    { icon: Image, label: uploading ? '上传中...' : '插入图片', action: () => fileInputRef.current?.click() },
  ]

  return (
    <div className={cn(
      'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all',
      isFullScreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'relative'
    )}>
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-2 py-1">
        {tools.map((tool, index) => {
          if (tool.divider) {
            return <div key={index} className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          }
          const Icon = tool.icon!
          return (
            <button
              key={index}
              type="button"
              onClick={tool.action}
              title={tool.label}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              disabled={uploading}
            >
              <Icon size={18} />
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-1">
          <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
            {wordCount} 字 · {readTime} 分钟
          </span>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            type="button"
            onClick={handleExport}
            title="导出Markdown文件"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            disabled={!value.trim()}
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={() => importFileInputRef.current?.click()}
            title="导入Markdown文件"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            disabled={importing}
          >
            <Upload size={18} />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            type="button"
            onClick={() => setMode(mode === 'split' ? 'edit' : mode === 'edit' ? 'preview' : 'split')}
            title="分屏编辑预览"
            className={cn(
              'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              mode === 'split' ? 'text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? '退出全屏' : '全屏写作'}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* 模式切换 */}
      {mode !== 'split' && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={cn(
              'px-4 py-2 text-sm font-medium',
              mode === 'edit'
                ? 'bg-white dark:bg-gray-900 text-primary border-r border-gray-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-r border-gray-200 dark:border-gray-700'
            )}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              'px-4 py-2 text-sm font-medium',
              mode === 'preview'
                ? 'bg-white dark:bg-gray-900 text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            预览
          </button>
        </div>
      )}

      {/* 内容区域 */}
      {mode === 'split' ? (
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2",
          isFullScreen ? "h-[calc(100vh-120px)]" : "h-[500px]"
        )}>
          <div className="border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                handleScroll()
              }}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || '开始写作... 使用 Markdown 语法'}
              className={cn(
                'border-0 rounded-none focus:ring-0 focus:border-0 text-base h-full',
              )}
            />
          </div>
          <div
            ref={previewRef}
            className={cn(
              'p-6 bg-white dark:bg-gray-900 prose dark:prose-invert max-w-none overflow-y-auto h-full'
            )}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-400">没有内容可预览</p>
            )}
          </div>
        </div>
      ) : mode === 'edit' ? (
        <div className={cn(
          isFullScreen ? "h-[calc(100vh-120px)]" : "auto"
        )}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '开始写作... 使用 Markdown 语法'}
            minRows={isFullScreen ? 30 : 20}
            className={cn(
              'border-0 rounded-none focus:ring-0 focus:border-0 text-base',
              isFullScreen && 'h-full'
            )}
          />
        </div>
      ) : (
        <div className={cn(
          'p-6 bg-white dark:bg-gray-900 prose dark:prose-invert max-w-none overflow-y-auto',
          isFullScreen ? 'h-[calc(100vh-120px)]' : 'max-h-[800px]'
        )}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400">没有内容可预览</p>
          )}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={importFileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}
