import { Card } from '@/components/ui/Card'

export default function AboutPage() {
  return (
    <div className="max-w-[700px] mx-auto">
      <Card className="p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">关于</h1>
        <div className="prose max-w-none text-gray-700">
          <p>
            欢迎来到我的极简博客。
          </p>
          <p>
            这是一个基于 Next.js 构建的轻量级博客系统，遵循极致简洁的设计理念，去除所有不必要的装饰，专注于内容阅读体验。
          </p>
          <p>
            特点：
          </p>
          <ul>
            <li>极简设计，专注阅读</li>
            <li>完美支持 Web 移动端双端适配</li>
            <li>轻量级 Markdown 写作</li>
            <li>内置完整的管理后台</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
