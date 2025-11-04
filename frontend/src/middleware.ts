import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/'],
  afterAuth(auth, req) {
    // Redirect to dashboard if signed in and accessing root
    if (auth.userId && req.nextUrl.pathname === '/') {
      const dashboard = new URL('/dashboard', req.url)
      return Response.redirect(dashboard)
    }
  },
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
