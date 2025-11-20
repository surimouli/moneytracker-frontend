export const runtime = 'nodejs';

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = auth();
  console.log('AUTH DEBUG SESSION:', session);
  return NextResponse.json(session, { status: 200 });
}
