interface WarnLike {
  warn: (event: string, data?: Record<string, unknown>) => void;
}

export function createWarnOnce(logger: WarnLike) {
  const seen = new Set<string>();
  return function warnOnce(key: string, message: string, data?: Record<string, unknown>): void {
    if (seen.has(key)) return;
    seen.add(key);
    logger.warn(`[deprecated:${key}] ${message}`, { firstOccurrence: true, ...(data ?? {}) });
  };
}
