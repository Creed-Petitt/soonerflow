"use client"

import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/auth-button"

export default function UserMenu() {
  const { data: session } = useSession()
  
  return <AuthButton />
}