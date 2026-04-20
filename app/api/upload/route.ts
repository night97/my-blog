import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 配置上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// 最大文件大小 5MB
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '只允许上传图片文件 (JPG, PNG, GIF, WebP)' }, { status: 400 })
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 })
    }

    // 生成唯一文件名
    const ext = path.extname(file.name)
    const filename = `${uuidv4()}${ext}`
    const filePath = path.join(UPLOAD_DIR, filename)

    // 转换为Buffer并保存
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)

    // 返回访问URL
    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
