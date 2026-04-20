import { NextResponse } from 'next/server'
import { verifyCredentials, setSessionCookie, clearSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const isValid = await verifyCredentials(username, password)

    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    setSessionCookie()
    return NextResponse.json({ success: true, redirect: '/admin/dashboard' })
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE() {
  clearSessionCookie()
  return NextResponse.json({ success: true, redirect: '/admin/login' })
}
