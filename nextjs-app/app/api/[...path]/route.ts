import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://127.0.0.1:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params
  const path = pathArray.join('/')
  const url = new URL(request.url)
  const queryString = url.search

  try {
    const response = await fetch(`${BACKEND_URL}/api/${path}${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params
  const path = pathArray.join('/')
  const body = await request.json()

  try {
    const response = await fetch(`${BACKEND_URL}/api/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params
  const path = pathArray.join('/')
  
  let body = null
  try {
    // Try to parse JSON body, but handle empty body gracefully
    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    }
  } catch (error) {
    console.error('Error parsing request body:', error)
    // Continue with null body if parsing fails
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params
  const path = pathArray.join('/')

  try {
    const response = await fetch(`${BACKEND_URL}/api/${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return NextResponse.json({ success: true }, { status: response.status })
    } else {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    )
  }
}