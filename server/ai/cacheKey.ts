import crypto from 'crypto';

export function buildCacheKey(params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams: Record<string, any> = {};
  for (const key of sortedKeys) {
    // Drop undefined so they don't affect hash identically, or just keep stringify
    if (params[key] !== undefined) {
      sortedParams[key] = params[key];
    }
  }
  const jsonStr = JSON.stringify(sortedParams);
  return crypto.createHash('sha256').update(jsonStr).digest('hex');
}
