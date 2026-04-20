import { generateHeadingId } from './utils'

export interface TocItem {
  depth: number
  value: string
  id: string
}

// 从 Markdown 内容提取目录 - 使用正则直接提取，简单稳定
export function extractToc(content: string): TocItem[] {
  const toc: TocItem[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{1,6}) (.+)$/)
    if (match) {
      const hashes = match[1]
      const value = match[2].trim()
      const depth = hashes.length

      if (value) {
        // 生成 id 用于锚点跳转
        const id = generateHeadingId(value)
        toc.push({
          depth,
          value,
          id,
        })
      }
    }
  }

  return toc
}
