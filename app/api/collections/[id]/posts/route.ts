import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// 获取专栏中的文章列表
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const collectionId = parseInt(params.id)
  const collectionPosts = await prisma.collectionPost.findMany({
    where: { collectionId },
    include: { post: true },
    orderBy: { position: 'asc' },
  })

  const posts = collectionPosts.map((cp: any) => ({
    ...cp.post,
    collectionPostId: cp.id,
    position: cp.position,
  }))

  return NextResponse.json({ posts })
}

// 更新专栏文章排序、添加、移除
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { posts, action, postId } = await request.json()
    const collectionId = parseInt(params.id)

    // 如果是更新排序
    if (Array.isArray(posts)) {
      // 删除所有现有文章
      await prisma.collectionPost.deleteMany({ where: { collectionId } })
      // 重新添加并更新位置
      for (let i = 0; i < posts.length; i++) {
        await prisma.collectionPost.create({
          data: {
            collectionId,
            postId: posts[i].id,
            position: i,
          },
        })
      }
      return NextResponse.json({ success: true })
    }

    // 如果是添加文章
    if (action === 'add' && postId) {
      // 获取当前最大位置
      const maxPosition = await prisma.collectionPost.findFirst({
        where: { collectionId },
        orderBy: { position: 'desc' },
      })
      const newPosition = maxPosition ? maxPosition.position + 1 : 0

      await prisma.collectionPost.create({
        data: {
          collectionId,
          postId: parseInt(postId),
          position: newPosition,
        },
      })
      return NextResponse.json({ success: true })
    }

    // 如果是移除文章
    if (action === 'remove' && postId) {
      await prisma.collectionPost.delete({
        where: {
          collectionId_postId: {
            collectionId,
            postId: parseInt(postId),
          },
        },
      })
      // 重新排序
      const remainingPosts = await prisma.collectionPost.findMany({
        where: { collectionId },
        orderBy: { position: 'asc' },
      })
      for (let i = 0; i < remainingPosts.length; i++) {
        await prisma.collectionPost.update({
          where: { id: remainingPosts[i].id },
          data: { position: i },
        })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
