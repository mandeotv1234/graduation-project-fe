import { AdminHeader } from '@/app/(main)/admin/components/admin-header'
import { AdminSidebar } from '@/app/(main)/admin/components/admin-sidebar'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-0 flex overflow-hidden bg-surface-container-lowest/50">
      <div className="hidden w-[260px] shrink-0 lg:flex lg:flex-col bg-surface-container-sub-low/70">
        <AdminSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
