/* global globalThis */
// Persist the same key across retries/refreshes of this checkout page.
// A new navigation from the cart has a new React Router location.key.
const memory = new Map();
function getCheckoutAttempt(owner, scope, payload) {
  const storageKey = `shopii.checkout.${owner}.${scope}`;
  const fingerprint = JSON.stringify(payload);
  let attempt = memory.get(storageKey);
  try { attempt = JSON.parse(sessionStorage.getItem(storageKey)) || attempt; } catch { /* Storage can be unavailable. */ }
  if (!attempt || attempt.fingerprint !== fingerprint) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    attempt = { key: Array.from(bytes, n => n.toString(16).padStart(2, '0')).join(''), fingerprint };
    memory.set(storageKey, attempt);
    try { sessionStorage.setItem(storageKey, JSON.stringify(attempt)); } catch { /* In-memory retry still works. */ }
  }
  return { ...attempt, storageKey };
}
function discardCheckoutAttempt(attempt) {
  memory.delete(attempt.storageKey);
  try { sessionStorage.removeItem(attempt.storageKey); } catch { /* No persistent storage. */ }
}
module.exports = { getCheckoutAttempt, discardCheckoutAttempt };
