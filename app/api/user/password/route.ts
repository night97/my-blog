import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('blog-admin-session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少6位' }, { status: 400 })
    }

    // 获取当前用户
    const user = await prisma.user.findFirst({
      where: { username: 'admin' }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 401 })
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    // 清除 session cookie，强制重新登录
    cookieStore.delete('blog-admin-session')

    return NextResponse.json({ success: true, redirect: '/admin/login' })
  } catch (error) {
    console.error('修改密码失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
