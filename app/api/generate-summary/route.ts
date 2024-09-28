import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { configuration } from '@/lib/openai-config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!configuration.apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { summary, activities } = body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes a person's workday based on their tracked activities." },
        { role: "user", content: `Please provide a brief summary of my workday based on the following data:
          
          Summary of time spent:
          ${Object.entries(summary).map(([type, data]) => 
            `${type}: ${(data as { totalHours: number; percentage: number }).totalHours} hours (${(data as { totalHours: number; percentage: number }).percentage}%)`
          ).join('\n')}
          
          Detailed activities:
          ${activities.map((a: { type: string; description: string; duration: number }) => 
            `${a.type}: ${a.description} (${Math.round(a.duration / 60)} mins)`).join('\n')}
          
          Please give an overview of how I spent my time, any patterns you notice, and any suggestions for improvement.` }
      ],
      max_tokens: 300,
    });

    return NextResponse.json({ summary: completion.choices[0].message?.content });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return NextResponse.json({ error: 'An error occurred during your request.' }, { status: 500 });
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const apiError = error as { response: { status: number; data: unknown } };
      console.error(apiError.response.status, apiError.response.data);
      return NextResponse.json({ error: apiError.response.data }, { status: apiError.response.status });
    } else {
      console.error('An unexpected error occurred');
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
  }
}