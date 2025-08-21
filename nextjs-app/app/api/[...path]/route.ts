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
        'X-API-Key': request.headers.get('x-api-key') || '',
      },
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      // Handle non-JSON response (likely error text)
      const text = await response.text()
      return NextResponse.json(
        { error: text || 'Backend error' },
        { status: response.status }
      )
    }
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
  const url = new URL(request.url)
  const queryString = url.search
  
  // Handle POST requests that may or may not have a body
  let body = null
  const contentType = request.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const text = await request.text()
    if (text) {
      try {
        body = JSON.parse(text)
      } catch (e) {
        // Empty body or invalid JSON
        body = null
      }
    }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/${path}${queryString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': request.headers.get('x-api-key') || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      // Handle non-JSON response (likely error text)
      const text = await response.text()
      return NextResponse.json(
        { error: text || 'Backend error' },
        { status: response.status }
      )
    }
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
        'X-API-Key': request.headers.get('x-api-key') || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      // Handle non-JSON response (likely error text)
      const text = await response.text()
      return NextResponse.json(
        { error: text || 'Backend error' },
        { status: response.status }
      )
    }
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
  const url = new URL(request.url)
  const queryString = url.search

  try {
    const response = await fetch(`${BACKEND_URL}/api/${path}${queryString}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': request.headers.get('x-api-key') || '',
      },
    })

    if (response.ok) {
      return NextResponse.json({ success: true }, { status: response.status })
    } else {
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      } else {
        // Handle non-JSON response (likely error text)
        const text = await response.text()
        return NextResponse.json(
          { error: text || 'Backend error' },
          { status: response.status }
        )
      }
    }
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    )
  }
}