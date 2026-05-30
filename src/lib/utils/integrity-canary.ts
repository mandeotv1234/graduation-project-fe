/**
 * Best-effort client integrity check. Verifies that a handful of native functions
 * the anti-cheat relies on still report native code — i.e. they were NOT replaced
 * by an injected script trying to neutralize violation tracking. Returns the names
 * that fail the check.
 *
 * Uses the `[native code]` toString test, NOT a DOM hash (which produces false
 * positives). This is a signal that raises the bar + feeds server-side detection,
 * not a security boundary — a determined attacker can also patch this check, in
 * which case the heartbeat-absence sweep is the backstop.
 */
export function runIntegrityCanary(): string[] {
  if (typeof window === 'undefined') return []

  const isNative = (fn: unknown): boolean => {
    try {
      return (
        typeof fn === 'function' &&
        Function.prototype.toString.call(fn).includes('[native code]')
      )
    } catch {
      return false
    }
  }

  const checks: Array<[string, unknown]> = [
    ['window.addEventListener', window.addEventListener],
    ['document.addEventListener', document.addEventListener],
    [
      'Element.prototype.requestFullscreen',
      Element.prototype.requestFullscreen
    ],
    ['document.exitFullscreen', document.exitFullscreen]
  ]

  return checks.filter(([, fn]) => !isNative(fn)).map(([name]) => name)
}
