import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Activity {
  type: string;
  duration: number;
  description: string;
  startTime: Date;
  endTime: Date;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received summary data:', body);
    const { date, totalHours, summaryText, activities } = body;

    const summary = await prisma.dailySummary.create({
      data: {
        date: new Date(date),
        totalHours,
        summaryText,
        activities: {
          create: activities.map((activity: Activity) => ({
            type: activity.type,
            duration: activity.duration,
            description: activity.description,
            startTime: new Date(activity.startTime),
            endTime: new Date(activity.endTime)
          }))
        }
      },
    });

    console.log('Created summary:', summary);
    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    console.error('Error creating summary:', error);
    return NextResponse.json({ error: 'Error creating summary' }, { status: 500 });
  }
}