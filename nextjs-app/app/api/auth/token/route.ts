import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Get the JWT token from the request
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET,
      raw: true // Get the raw JWT string
    })
    
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }
    
    return NextResponse.json({ token })
  } catch (error) {
    console.error("Error getting token:", error)
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 })
  }
}