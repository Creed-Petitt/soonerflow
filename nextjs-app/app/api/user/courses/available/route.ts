import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get('user_email')

  if (!userEmail) {
    return NextResponse.json({ error: 'User email is required' }, { status: 400 })
  }

  try {
    // Fetch user's degree requirements
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/degree-requirements?user_email=${encodeURIComponent(userEmail)}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch degree requirements')
    }

    const data = await response.json()
    
    // Transform the requirements into a simpler format for the selector
    const courses = data.requirements?.map((req: any) => ({
      code: req.course_code,
      name: req.course_name || req.course_code,
      credits: req.credits || 3,
      category: req.category,
      status: req.status
    })) || []

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching available courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available courses' },
      { status: 500 }
    )
  }
}