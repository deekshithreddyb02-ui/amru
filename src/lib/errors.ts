/**
 * Sanitizes error messages to prevent leaking sensitive system information.
 * Maps technical errors to user-friendly messages.
 */
export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'An error occurred');
  const lowerMessage = message.toLowerCase();

  const errorPatterns: Record<string, string> = {
    'row-level security': 'You do not have permission for this action',
    'does not exist': 'The requested resource was not found',
    'violates unique': 'This entry already exists',
    'violates': 'The data you entered is invalid',
    'duplicate': 'This entry already exists',
    'foreign key': 'This operation cannot be completed due to related data',
    'network': 'Network error. Please check your connection',
    'jwt': 'Your session has expired. Please log in again',
    'token': 'Your session has expired. Please log in again',
    'connection': 'Unable to connect to the server. Please try again',
    'timeout': 'The request took too long. Please try again',
    'rate limit': 'Too many requests. Please wait a moment',
    'user already registered': 'This email is already registered. Please login instead.',
    'invalid login credentials': 'Invalid email or password. Please try again.',
    'email not confirmed': 'Please verify your email before signing in.',
  };

  for (const [pattern, userMessage] of Object.entries(errorPatterns)) {
    if (lowerMessage.includes(pattern)) {
      console.error('[Sanitized error]:', error);
      return userMessage;
    }
  }

  console.error('[Unknown error]:', error);
  return 'An unexpected error occurred. Please try again';
}
