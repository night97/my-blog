import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import matter from 'gray-matter'

// 文件名转标题：kebab-case → Title Case
function filenameToTitle(filename: string): string {
  // 移除扩展名
  const name = filename.replace(/\.md$/, '').replace(/\.markdown$/, '')
  // 替换分隔符为空格
  const spaced = name.replace(/[-_]/g, ' ')
  // 转为标题格式
  return spaced.split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function POST(request: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const defaultPublished = formData.get('defaultPublished') === 'true'

    if (files.length === 0) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    const created: Array<{ id: number; title: string; slug: string }> = []
    const errors: Array<{ filename: string; error: string }> = []

    for (const file of files) {
      try {
        // 检查文件类型
        if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
          errors.push({
            filename: file.name,
            error: '仅支持 .md 格式文件',
          })
          continue
        }

        // 读取文件内容
        const content = await file.text()
        // 解析 frontmatter
        const { data, content: markdownContent } = matter(content)

        // 提取标题
        let title: string
        if (data.title && typeof data.title === 'string') {
          title = data.title
        } else {
          title = filenameToTitle(file.name)
        }

        // 提取摘要
        let excerpt: string | undefined
        if (data.excerpt && typeof data.excerpt === 'string') {
          excerpt = data.excerpt
        } else if (data.description && typeof data.description === 'string') {
          excerpt = data.description
        }

        // 提取发布状态
        let published: boolean
        if (typeof data.published === 'boolean') {
          published = data.published
        } else {
          published = defaultPublished
        }

        // 提取 slug
        let customSlug: string | undefined
        if (data.slug && typeof data.slug === 'string') {
          customSlug = data.slug
        }

        // 生成 slug 并处理重复
        const baseSlug = customSlug || generateSlug(title)
        let finalSlug = baseSlug
        let counter = 1
        while (await prisma.post.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${baseSlug}-${counter}`
          counter++
        }

        // 创建文章
        const post = await prisma.post.create({
          data: {
            title,
            slug: finalSlug,
            excerpt: excerpt || null,
            content: markdownContent,
            published,
          },
        })

        created.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
        })
      } catch (err) {
        errors.push({
          filename: file.name,
          error: err instanceof Error ? err.message : '处理失败',
        })
      }
    }

    return NextResponse.json({
      success: true,
      total: files.length,
      created,
      errors,
    })
  } catch (err) {
    return NextResponse.json({ error: '上传处理失败' }, { status: 500 })
  }
}
