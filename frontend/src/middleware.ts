import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware((auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    auth().protect()
  }

  // Redirect to dashboard if signed in and accessing root
  if (auth().userId && req.nextUrl.pathname === '/') {
    const dashboard = new URL('/dashboard', req.url)
    return Response.redirect(dashboard)
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
