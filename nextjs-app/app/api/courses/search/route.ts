import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '50';

    // Construct FastAPI URL
    const fastApiUrl = new URL('/api/classes', API_BASE_URL);
    fastApiUrl.searchParams.set('search', query);
    fastApiUrl.searchParams.set('limit', limit);

    const response = await fetch(fastApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('FastAPI search failed:', response.status, response.statusText);
      
      // Return empty results instead of error to avoid breaking UI
      return NextResponse.json({
        courses: [],
        total: 0,
        message: 'Search temporarily unavailable'
      });
    }

    const data = await response.json();
    
    // Transform the data to match the expected format for the flowchart page
    const transformedCourses = data.classes?.map((cls: any) => ({
      id: cls.id,
      code: `${cls.subject} ${cls.number}`,
      title: cls.title,
      credits: cls.credits || 3,
      category: 'Program Requirements', // Default category
      status: 'Not Started'
    })) || [];
    
    return NextResponse.json({
      courses: transformedCourses,
      total: data.total || transformedCourses.length
    });

  } catch (error) {
    console.error('Course search error:', error);
    
    // Return empty results instead of error to avoid breaking UI
    return NextResponse.json({
      courses: [],
      total: 0,
      message: 'Search temporarily unavailable'
    });
  }
}