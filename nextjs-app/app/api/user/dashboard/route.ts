import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('user_email');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Missing user_email' }, { status: 400 });
    }
    
    // Forward to backend
    const response = await fetch(`http://localhost:8000/api/user/dashboard?user_email=${encodeURIComponent(userEmail)}`);
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}