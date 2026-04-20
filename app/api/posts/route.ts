import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

// 获取文章列表（管理员看到所有，公开只看到已发布）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeUnpublished = searchParams.get('admin') === 'true' && isAuthenticated()

  const posts = await prisma.post.findMany({
    where: includeUnpublished ? undefined : { published: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      published: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ posts })
}

// 创建文章
export async function POST(request: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { title, excerpt, content, published, tagIds } = await request.json()
    const slug = generateSlug(title)

    // 检查 slug 是否重复，如果重复加序号
    let finalSlug = slug
    let counter = 1
    while (await prisma.post.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        content: content || '',
        published: published || false,
        ...(tagIds && tagIds.length > 0 ? {
          tags: {
            connect: tagIds.map((id: number) => ({ id })),
          },
        } : {}),
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
