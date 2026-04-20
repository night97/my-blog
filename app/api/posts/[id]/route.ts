import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

// 获取单篇文章（编辑用）
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }

  return NextResponse.json({ post, tags: post.tags })
}

// 更新文章
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { title, slug, excerpt, content, published, tagIds } = await request.json()
    const id = parseInt(params.id)

    // 如果 slug 变了，检查新 slug 是否重复
    let finalSlug = slug
    if (slug) {
      const existing = await prisma.post.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        let counter = 1
        while (await prisma.post.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`
          counter++
        }
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        content,
        published,
        // 更新标签关联
        ...(tagIds !== undefined ? {
          tags: {
            set: tagIds.map((id: number) => ({ id })),
          },
        } : {}),
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

// 删除文章
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    await prisma.post.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
