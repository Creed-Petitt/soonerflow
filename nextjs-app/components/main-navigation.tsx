"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth-button"
import { Settings, Search } from "lucide-react"

export function MainNavigation() {
  const pathname = usePathname()

  return (
    <header className="px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side - Navigation */}
        <nav className="flex items-center gap-1">
          <Link 
            href="/dashboard" 
            className={`py-2 px-3 font-medium transition-colors rounded-md ${
              pathname === "/dashboard" 
                ? "text-foreground bg-muted/50" 
                : "text-muted-foreground hover:text-primary hover:bg-muted/50"
            }`}
          >
            Home
          </Link>
          <Link 
            href="/scheduler" 
            className={`py-2 px-3 font-medium transition-colors rounded-md ${
              pathname === "/scheduler" 
                ? "text-foreground bg-muted/50" 
                : "text-muted-foreground hover:text-primary hover:bg-muted/50"
            }`}
          >
            Scheduler
          </Link>
          <Link 
            href="/progress" 
            className={`py-2 px-3 font-medium transition-colors rounded-md ${
              pathname === "/progress" 
                ? "text-foreground bg-muted/50" 
                : "text-muted-foreground hover:text-primary hover:bg-muted/50"
            }`}
          >
            Degree Progress
          </Link>
          <Link 
            href="/canvas" 
            className={`py-2 px-3 font-medium transition-colors rounded-md ${
              pathname === "/canvas" 
                ? "text-foreground bg-muted/50" 
                : "text-muted-foreground hover:text-primary hover:bg-muted/50"
            }`}
          >
            Canvas
          </Link>
        </nav>

        {/* Right side - Search and Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="pl-9 w-[280px] h-10 bg-muted/50 border-border"
            />
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="h-10 w-10">
            <Settings className="h-4 w-4" />
          </Button>
          <AuthButton />
        </div>
      </div>
    </header>
  )
}