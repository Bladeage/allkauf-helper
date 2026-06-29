// Das Auth-Token liegt im httpOnly-Cookie (per JS NICHT lesbar).
// Hier nur ein NICHT-sensibler Flag für die Multi-Tab-Synchronisation (Login/Logout über Tabs).
export const AUTH_FLAG = 'alkauf_auth';

export function markLoggedIn(): void {
  try {
    localStorage.setItem(AUTH_FLAG, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function markLoggedOut(): void {
  try {
    localStorage.removeItem(AUTH_FLAG);
  } catch {
    /* ignore */
  }
}
