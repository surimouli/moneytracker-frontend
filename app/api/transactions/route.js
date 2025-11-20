// app/api/transactions/route.js

export const runtime = 'nodejs'; // make sure this runs on the Node runtime

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/transactions  -> list current user's transactions
export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions, { status: 200 });
  } catch (err) {
    console.error('GET /api/transactions error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/transactions  -> create a new transaction
export async function POST(request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, category, description, date } = body;

    if (!amount || !type || !category) {
      return NextResponse.json(
        { error: 'amount, type, and category are required' },
        { status: 400 }
      );
    }

    const created = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type,
        category,
        description: description || null,
        date: date ? new Date(date) : undefined,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/transactions error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}