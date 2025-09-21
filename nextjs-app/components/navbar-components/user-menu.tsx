"use client"

import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function UserMenu() {
  // Simplified user menu without auth for now
  return (
    <Button variant="ghost" size="sm">
      <User className="h-4 w-4 mr-2" />
      User
    </Button>
  )
}