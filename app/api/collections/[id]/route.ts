import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// 获取单篇专栏（编辑用）
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const collection = await prisma.collection.findUnique({
    where: { id: parseInt(params.id) },
  })

  if (!collection) {
    return NextResponse.json({ error: '专栏不存在' }, { status: 404 })
  }

  return NextResponse.json({ collection })
}

// 更新专栏
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { name, slug, description, cover, published } = await request.json()
    const id = parseInt(params.id)

    // 如果 slug 变了，检查新 slug 是否重复
    let finalSlug = slug
    if (slug) {
      const existing = await prisma.collection.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        let counter = 1
        while (await prisma.collection.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`
          counter++
        }
      }
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        cover: cover || null,
        published,
      },
    })

    return NextResponse.json({ success: true, collection })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

// 删除专栏
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    await prisma.collection.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
