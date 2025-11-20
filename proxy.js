// proxy.js
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  // Apply Clerk to everything except static files and Next internals
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ],
};