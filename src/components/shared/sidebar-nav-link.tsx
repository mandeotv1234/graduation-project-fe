'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, type ComponentProps, type MouseEvent } from 'react'

import { cn } from '@/lib/utils'

type SidebarNavLinkProps = Omit<
  ComponentProps<typeof Link>,
  'href' | 'onClick'
> & {
  href: string
  isActive?: boolean
}

export function SidebarNavLink({
  href,
  isActive = false,
  className,
  children,
  ...props
}: SidebarNavLinkProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    isNavigatingRef.current = false
  }, [pathname])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isActive || isNavigatingRef.current) {
      event.preventDefault()
      return
    }

    event.preventDefault()
    isNavigatingRef.current = true
    router.push(href)
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  )
}
