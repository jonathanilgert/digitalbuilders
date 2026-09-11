import { claimNotification, releaseNotificationClaim } from "./store";

/**
 * Claims a durable notification key before invoking the provider. Concurrent webhook
 * deliveries therefore cannot both send. Provider failures release only this claimant's
 * token so a later webhook delivery can retry; successful claims remain as receipts.
 */
export async function sendNotificationOnce(scope: string, key: string, send: () => Promise<unknown>) {
  const claim = await claimNotification(scope, key);
  if (!claim.claimed || !claim.token) return false;
  try {
    await send();
    return true;
  } catch (error) {
    await releaseNotificationClaim(scope, key, claim.token);
    throw error;
  }
}
