export function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'digest' in error &&
    typeof (error as Error & { digest: string }).digest === 'string' &&
    (error as Error & { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}
