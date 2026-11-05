import { createHash } from 'node:crypto';
import { sql } from '@/lib/db';

type RateLimitRule = {
  bucketKey: string;
  maxAttempts: number;
  windowSeconds: number;
  cooldownSeconds: number;
};

export function createRateLimitBucket(scope: string, value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${scope}:${hash}`;
}

export async function consumeRateLimitBuckets(rules: RateLimitRule[]) {
  const database = sql;
  if (!database) {
    throw new Error('La base de datos no está configurada para limitar peticiones.');
  }
  if (rules.length === 0) return 0;

  await database`
    DELETE FROM api_rate_limits
    WHERE bucket_key IN (
      SELECT bucket_key
      FROM api_rate_limits
      WHERE updated_at < NOW() - INTERVAL '1 day'
      ORDER BY updated_at ASC
      LIMIT 100
    );
  `;

  const results = await database.transaction(
    rules.map((rule) => database`
      INSERT INTO api_rate_limits (bucket_key, attempts, window_started_at, updated_at)
      VALUES (${rule.bucketKey}, 1, NOW(), NOW())
      ON CONFLICT (bucket_key) DO UPDATE SET
        attempts = CASE
          WHEN api_rate_limits.window_started_at <= NOW() - (${rule.windowSeconds}::INTEGER * INTERVAL '1 second')
            OR api_rate_limits.blocked_until <= NOW()
          THEN 1
          ELSE api_rate_limits.attempts + 1
        END,
        window_started_at = CASE
          WHEN api_rate_limits.window_started_at <= NOW() - (${rule.windowSeconds}::INTEGER * INTERVAL '1 second')
            OR api_rate_limits.blocked_until <= NOW()
          THEN NOW()
          ELSE api_rate_limits.window_started_at
        END,
        blocked_until = CASE
          WHEN api_rate_limits.window_started_at <= NOW() - (${rule.windowSeconds}::INTEGER * INTERVAL '1 second')
            OR api_rate_limits.blocked_until <= NOW()
          THEN NULL
          WHEN api_rate_limits.blocked_until > NOW()
          THEN api_rate_limits.blocked_until
          WHEN api_rate_limits.attempts + 1 > ${rule.maxAttempts}
          THEN NOW() + (${rule.cooldownSeconds}::INTEGER * INTERVAL '1 second')
          ELSE NULL
        END,
        updated_at = NOW()
      RETURNING
        blocked_until > NOW() AS blocked,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (blocked_until - NOW()))))::INTEGER AS "retryAfter";
    `),
  );

  return results.reduce((retryAfter, rows) => {
    const [state] = rows;
    return state?.blocked ? Math.max(retryAfter, Number(state.retryAfter) || 1) : retryAfter;
  }, 0);
}

export async function clearRateLimitBuckets(bucketKeys: string[]) {
  const database = sql;
  if (!database) {
    throw new Error('La base de datos no está configurada para limitar peticiones.');
  }

  await database.transaction(
    bucketKeys.map((bucketKey) => database`
      DELETE FROM api_rate_limits WHERE bucket_key = ${bucketKey};
    `),
  );
}
