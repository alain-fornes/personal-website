// Middleware disabled - causing deployment issues
// We can add it back later when needed for auth features
// import { updateSession } from './utils/supabase/middleware'

export async function middleware(request) {
  // Disabled - just pass through all requests
  return
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 