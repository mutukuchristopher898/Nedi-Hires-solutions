// Turns sign in / sign up errors from the authentication service into plain
// messages that say what happened and what to do. The raw messages ("Invalid
// login credentials", "AuthApiError: ...") read as technical and, for some
// errors, say more than they should.

interface AuthErrorLike {
  message?: string;
  status?: number;
  code?: string;
}

export function friendlyAuthError(error: AuthErrorLike | null | undefined): string {
  const message = (error?.message ?? "").toLowerCase();
  const code = (error?.code ?? "").toLowerCase();

  if (error?.status === 429 || message.includes("rate limit") || code.includes("rate_limit")) {
    return "Too many attempts. Please wait a few minutes, then try again.";
  }
  // Deliberately the same message whether the email or the password was
  // wrong, so the form cannot be used to find out who has an account.
  if (message.includes("invalid login credentials") || code === "invalid_credentials") {
    return "That email and password don’t match. Check them and try again, or reset your password.";
  }
  if (message.includes("email not confirmed") || code === "email_not_confirmed") {
    return "Please confirm your email address first. Use the link we sent when you created your account.";
  }
  if (message.includes("already registered") || code === "user_already_exists") {
    return "An account already uses this email. Sign in instead, or reset your password.";
  }
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("characters"))) {
    return "Please choose a stronger password: at least 8 characters, mixing letters, numbers and symbols.";
  }
  if (message.includes("same password") || code === "same_password") {
    return "Your new password must be different from your current one.";
  }
  if (message.includes("expired") || message.includes("invalid") && message.includes("link")) {
    return "This link has expired. Please request a new one.";
  }
  if (message.includes("fetch") || message.includes("network")) {
    return "We couldn’t reach the server. Check your internet connection and try again.";
  }
  return "Something went wrong. Please try again in a moment.";
}
