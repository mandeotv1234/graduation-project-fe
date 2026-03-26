'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, GraduationCap } from 'lucide-react'

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

  useEffect(() => {
    getMe().then((res) => {
      if (res.data) setUser(res.data)
    })
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push(PATH.LOGIN)
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href={PATH.STUDENT_EXAMS} className={styles.logo}>
          <GraduationCap className={styles.logoIcon} />
          <span>DATN Portal</span>
        </Link>

        <nav className={styles.nav}>
          <Link href={PATH.STUDENT_EXAMS} className={styles.navLink}>
            Bài thi
          </Link>
        </nav>

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
              className={styles.logoutButton}
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
