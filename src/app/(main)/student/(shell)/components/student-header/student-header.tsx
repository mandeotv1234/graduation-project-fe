'use client'

import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { PATH } from '@/lib/constants'
import { logout, getMe } from '@/lib/actions'
import { useEffect, useState } from 'react'
import { User as UserType } from '@/lib/types'
import styles from '@/app/(main)/student/(shell)/components/student-header/student-header.module.scss'

export function StudentHeader() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    getMe().then((res) => {
      if (res.data) setUser(res.data)
    })
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
      router.push(PATH.LOGIN)
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className="flex-1" />

        <div className={styles.headerActions}>
          {user && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user.fullName}</p>
              <p className={styles.userDetails}>
                {user.studentId ? `MSSV: ${user.studentId}` : user.email}
              </p>
            </div>
          )}
          <div className={styles.actionButtons}>
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={styles.logoutButton}
              title={isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              aria-label={isLoggingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
