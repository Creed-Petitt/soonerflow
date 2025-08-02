"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Settings, User } from "lucide-react"

export function MainNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Home" },
    { href: "/scheduler", label: "Scheduler" },
    { href: "/browse", label: "Browse Classes" },
    { href: "/degree-progress", label: "Degree Progress" },
    { href: "/professors", label: "Professors" },
    { href: "/canvas", label: "Canvas" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-b-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              OU
            </div>
            <span className="font-semibold">Class Manager</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={pathname === item.href ? "default" : "ghost"} 
                  size="sm"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}