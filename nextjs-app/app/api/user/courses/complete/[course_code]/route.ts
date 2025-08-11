import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { course_code: string } }
) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get('user_email')
  const courseCode = params.course_code

  if (!userEmail || !courseCode) {
    return NextResponse.json(
      { error: 'Email and course code are required' },
      { status: 400 }
    )
  }

  try {
    // Call backend to remove completed course
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/courses/complete/${encodeURIComponent(courseCode)}?user_email=${encodeURIComponent(userEmail)}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to remove course: ${error}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error removing course:', error)
    return NextResponse.json(
      { error: 'Failed to remove course' },
      { status: 500 }
    )
  }
}