export function isProbablyOffline(error: unknown): boolean {
  if (!error) return false;

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();

  return /Network request failed|Failed to fetch|fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|timeout/i.test(
    message
  );
}

