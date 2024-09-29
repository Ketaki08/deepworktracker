import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received data for summary generation:', body);

    const { summary, activities } = body;

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

    const generatedSummary = completion.choices[0].message?.content;

    console.log('Generated summary:', generatedSummary);

    return NextResponse.json({ summary: generatedSummary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'An error occurred during summary generation.' }, { status: 500 });
  }
}