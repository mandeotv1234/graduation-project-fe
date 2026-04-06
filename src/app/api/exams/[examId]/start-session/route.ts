/**
 * Next.js API Route: POST /api/exams/[examId]/start-session
 *
 * Acts as a transparent proxy to the backend /api/exams/{examId}/start-session.
 * This route exists so that:
 *  1. The request originates from the browser (not the Next.js server), so the
 *     real client IP and User-Agent are captured by this handler.
 *  2. We forward those real values (via X-Forwarded-For + User-Agent) to the backend,
 *     allowing the backend to perform accurate device fingerprinting for device-conflict
 *     detection.
 *
 * Without this proxy, calling startExamSession() as a Server Action means:
 *  - The request comes from the Next.js Node.js server → IP = 127.0.0.1
 *  - User-Agent = Node.js, not the student's real browser
 *  → All students share the same fingerprint → conflict detection never fires.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params

  // --- 1. Get auth token from server-side cookies ---
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value

  if (!accessToken) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: 'No access token' },
      { status: 401 }
    )
  }

  // --- 2. Collect real client fingerprint ---
  // IP: prioritize X-Forwarded-For (nginx/load balancer), fallback to x-real-ip
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? '0.0.0.0'

  // User-Agent: the actual browser UA
  const userAgent = request.headers.get('user-agent') ?? 'Unknown'

  // --- 3. Forward to backend ---
  const backendUrl = `${BACKEND_URL}/exams/${examId}/start-session`

  try {
    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        // Forward real client info so backend can fingerprint accurately
        'X-Forwarded-For': clientIp,
        'X-Real-IP': clientIp,
        'User-Agent': userAgent
      }
    })

    const body = await backendRes.json()

    return NextResponse.json(body, { status: backendRes.status })
  } catch (error) {
    console.error('[API Route] start-session proxy error:', error)
    return NextResponse.json(
      { code: 'PROXY_ERROR', message: 'Failed to reach backend' },
      { status: 502 }
    )
  }
}
