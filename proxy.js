// proxy.js
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

// Apply Clerk to everything except static files and Next internals
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};