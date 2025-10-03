"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type HeaderProps = {
  page?: string
  className?: string
  rightSlot?: React.ReactNode
  logoSrc?: string
  title?: string
}

function Brand({ logoSrc, title }: { logoSrc: string; title: string }) {
  return (
    <div className={cn("flex items-center gap-2")}>
      <img src={logoSrc || "/placeholder.svg"} alt={`${title} logo`} className="h-5 w-auto" />
      <span className="text-lg font-semibold text-foreground">{title}</span>
    </div>
  )
}

export default function Header({ page, className, rightSlot, logoSrc = "/Logo1.png", title = "Evalo" }: HeaderProps) {
  const { data: session } = useSession()
  const isTestEditor = page === "testeditor"

  return (
    <header
      className={cn(
        "w-full border-b bg-background h-14",
        isTestEditor && "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <nav className="flex h-14 items-center justify-between" aria-label="Global">
          <Link href="/" aria-label={`${title} home`} className="inline-flex">
            <Brand logoSrc={logoSrc} title={title} />
          </Link>

          <div className="flex items-center gap-3">
            {rightSlot}
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{session?.user?.name || "User"}</span>
            </div>
            <Avatar className="h-8 w-8 ring-2 ring-sidebar-border">
              <AvatarImage src={session?.user?.image || "/default-avatar.png"} />
              <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </nav>
      </div>
    </header>
  )
}
