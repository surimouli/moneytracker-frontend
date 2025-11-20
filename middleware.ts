// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

// Apply Clerk to all routes except static files and Next internals
export const config = {
  matcher: [
    // Match all paths except for:
    // - static files like /_next, /favicon.ico
    // - files with an extension like .css, .js, .png
    '/((?!_next|.*\\..*).*)',
  ],
};