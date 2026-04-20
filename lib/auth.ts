import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { cache } from 'react'

const SESSION_COOKIE_NAME = 'blog-admin-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// 初始化默认管理员账号
export async function initDefaultAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
      },
    })
    console.log('Default admin created: username=admin, password=admin123')
  }
}

// 验证用户名密码
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return false
  }

  return bcrypt.compare(password, user.passwordHash)
}

// 设置登录 Cookie
export function setSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: 'authenticated',
    httpOnly: true,
    secure: false, // 允许 HTTP
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

// 清除登录 Cookie
export function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

// 验证是否已登录（缓存结果，避免多次读取 Cookie）
export const isAuthenticated = cache((): boolean => {
  const cookie = cookies().get(SESSION_COOKIE_NAME)
  return cookie?.value === 'authenticated'
})

// 获取当前登录状态（用于服务端组件）
export async function getCurrentUser() {
  if (!isAuthenticated()) {
    return null
  }
  // 返回第一个 admin 用户
  return prisma.user.findFirst({ where: { username: 'admin' } })
}
