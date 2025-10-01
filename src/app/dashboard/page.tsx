"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Plus,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import CreateTest from "@/components/CreateTest"

type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "create-test", label: "Create Test", icon: Plus },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout() {
  const [active, setActive] = useState("dashboard")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const { data: session, status } = useSession()


  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }


  return (
    <div className="flex h-screen bg-background">
      <aside className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border relative">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-sidebar/50 to-transparent pointer-events-none"
        />

        <div className="relative flex items-center gap-3 px-6 py-3 border-b border-sidebar-border/50">
          <img src="/Logo1.png" alt="Evalo Logo" className="h-5 w-auto" />
          <h1 className="font-semibold text-lg text-sidebar-foreground">Evalo</h1>
        </div>

        <nav className="flex-1 px-4 py-2 mt-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 px-3 rounded-lg transition-all duration-200 group",
                    active === item.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  onClick={() => setActive(item.id)}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 mr-3 transition-transform duration-200",
                      active === item.id ? "scale-110" : "group-hover:scale-105",
                    )}
                  />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </nav>

        <div className="relative border-t border-sidebar-border/50 p-2">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors duration-200 group"
          >
            <Avatar className="h-8 w-8 ring-2 ring-sidebar-border">
              <AvatarImage src={session?.user?.image || "/default-avatar.png"} />
              <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{session?.user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email || "No email"}</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                showUserDropdown && "rotate-180",
              )}
            />
          </button>

          {showUserDropdown && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-sidebar border border-sidebar-border rounded-lg shadow-lg shadow-black/10 py-2 z-50">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150">
                <User className="h-4 w-4" />
                Profile
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <div className="h-px bg-sidebar-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-background overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {active === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border">
                  <h3 className="font-semibold text-card-foreground mb-2">Total Projects</h3>
                  <p className="text-3xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground mt-1">+2 from last month</p>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border">
                  <h3 className="font-semibold text-card-foreground mb-2">Active Tasks</h3>
                  <p className="text-3xl font-bold text-primary">24</p>
                  <p className="text-sm text-muted-foreground mt-1">8 due this week</p>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border">
                  <h3 className="font-semibold text-card-foreground mb-2">Completed</h3>
                  <p className="text-3xl font-bold text-primary">156</p>
                  <p className="text-sm text-muted-foreground mt-1">This month</p>
                </div>
              </div>
            </div>
          )}
          {active === "create-test" && <CreateTest />}
          {active === "settings" && (
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Display Name</label>
                    <input
                      type="text"
                      value={session?.user?.name || ""}
                      className="mt-1 w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      value={session?.user?.email || ""}
                      className="mt-1 w-full h-9 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
