// app/api/transactions/route.js

export const runtime = 'nodejs';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const { userId } = auth();

    console.log('AUTH RESULT IN GET /api/transactions:', { userId });

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
      { status: 500 },
    );
  }
}