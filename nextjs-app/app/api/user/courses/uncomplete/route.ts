import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, course_code } = body

    if (!email || !course_code) {
      return NextResponse.json(
        { error: 'Email and course code are required' },
        { status: 400 }
      )
    }

    // Call backend to remove completed course
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/courses/uncomplete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          course_code
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to remove course completion: ${error}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error removing course completion:', error)
    return NextResponse.json(
      { error: 'Failed to remove course completion' },
      { status: 500 }
    )
  }
}