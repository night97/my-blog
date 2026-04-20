import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">页面未找到</h2>
        <p className="mt-2 text-gray-500">你访问的页面不存在</p>
        <div className="mt-6">
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
