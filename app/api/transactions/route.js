// app/api/transactions/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/transactions?userId=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('GET /api/transactions userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 401 }
      );
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

// POST /api/transactions
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, amount, type, category, description, date } = body;

    console.log('POST /api/transactions userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 401 }
      );
    }

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