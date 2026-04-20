import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

// 获取专栏列表（管理员看到所有，公开只看到已发布）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeUnpublished = searchParams.get('admin') === 'true' && isAuthenticated()

  const collections = await prisma.collection.findMany({
    where: includeUnpublished ? undefined : { published: true },
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ collections })
}

// 创建专栏
export async function POST(request: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { name, description, cover, published } = await request.json()
    const slug = generateSlug(name)

    // 检查 slug 是否重复，如果重复加序号
    let finalSlug = slug
    let counter = 1
    while (await prisma.collection.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        cover: cover || null,
        published: published || false,
      },
    })

    return NextResponse.json({ success: true, collection })
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
