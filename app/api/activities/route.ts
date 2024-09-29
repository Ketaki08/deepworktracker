import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, description, startTime, endTime, duration } = body;

    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Error creating activity' }, { status: 500 });
  }
}