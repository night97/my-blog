import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { isAuthenticated } from '@/lib/auth'

// GET: 获取所有标签
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('获取标签失败:', error)
    return NextResponse.json({ error: '获取标签失败' }, { status: 500 })
  }
}

// POST: 创建新标签
export async function POST(request: Request) {
  // 需要管理员认证
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // 检查是否已存在
    const existing = await prisma.tag.findUnique({
      where: { slug },
    })
    if (existing) {
      return NextResponse.json({ error: '标签已存在' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        slug,
      },
    })

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('创建标签失败:', error)
    return NextResponse.json({ error: '创建标签失败' }, { status: 500 })
  }
}
