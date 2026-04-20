import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import ReadingProgress from '@/components/ReadingProgress'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 dark:bg-gray-900">
      <ReadingProgress />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
