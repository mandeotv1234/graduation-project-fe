import { UserList } from '@/app/(main)/admin/users/components/user-list/user-list'

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Người dùng</h1>
        <p className="text-muted-foreground">
          Quản lý vai trò và thông tin tài khoản người dùng trong hệ thống
        </p>
      </div>
      <UserList />
    </div>
  )
}
