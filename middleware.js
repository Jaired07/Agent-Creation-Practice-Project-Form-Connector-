import { authMiddleware } from "@clerk/nextjs";

/**
 * Clerk authentication middleware
 * 
 * This middleware protects all routes except those explicitly marked as public.
 * The /api/submit/[connectorId] endpoint remains public to allow form submissions
 * from external sources without authentication.
 * 
 * Public routes:
 * - / (home page)
 * - /api/submit/* (webhook endpoints for form submissions)
 */
export default authMiddleware({
  publicRoutes: ["/", "/api/submit/(.*)"],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};





