import { NextRequest, NextResponse } from 'next/server';
import { generateInsightsFlow } from '@/lib/ai/insights-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processedData, profile } = body;

    if (!processedData) {
      return NextResponse.json(
        { error: 'Missing processed health data' },
        { status: 400 }
      );
    }

    const insights = await generateInsightsFlow(processedData);

    return NextResponse.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Insights API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 