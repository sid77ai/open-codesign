import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRecent, readReported, recordReported, writeAtomic } from './reported-fingerprints';

function freshDir(): string {
  return mkdtempSync(join(tmpdir(), 'reported-fp-'));
}

describe('readReported', () => {
  it('returns empty defaults when the file is missing', () => {
    const dir = freshDir();
    try {
      const out = readReported(join(dir, 'reported-fingerprints.json'));
      expect(out).toEqual({ schemaVersion: 1, entries: [] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns entries from an existing file', () => {
    const dir = freshDir();
    const file = join(dir, 'reported-fingerprints.json');
    const payload = {
      schemaVersion: 1,
      entries: [{ fingerprint: 'abc', ts: 1000, issueUrl: 'https://x/1' }],
    };
    try {
      writeFileSync(file, JSON.stringify(payload));
      const out = readReported(file);
      expect(out.entries).toEqual(payload.entries);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('recordReported', () => {
  it('appends a new entry', () => {
    const dir = freshDir();
    const file = join(dir, 'reported-fingerprints.json');
    try {
      recordReported(file, 'abc', 'https://x/1', () => 10_000);
      const out = readReported(file);
      expect(out.entries).toHaveLength(1);
      expect(out.entries[0]).toEqual({ fingerprint: 'abc', ts: 10_000, issueUrl: 'https://x/1' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('prunes entries older than 24h on write', () => {
    const dir = freshDir();
    const file = join(dir, 'reported-fingerprints.json');
    const now = 100 * 86_400_000; // day 100
    try {
      writeFileSync(
        file,
        JSON.stringify({
          schemaVersion: 1,
          entries: [
            { fingerprint: 'old', ts: now - 25 * 3_600_000, issueUrl: 'https://x/old' },
            { fingerprint: 'fresh', ts: now - 1_000, issueUrl: 'https://x/fresh' },
          ],
        }),
      );
      recordReported(file, 'new', 'https://x/new', () => now);
      const out = readReported(file);
      const fps = out.entries.map((e) => e.fingerprint).sort();
      expect(fps).toEqual(['fresh', 'new']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('findRecent', () => {
  it('returns undefined for unknown fingerprint', () => {
    const dir = freshDir();
    const file = join(dir, 'reported-fingerprints.json');
    try {
      recordReported(file, 'abc', 'https://x/1', () => 10_000);
      const out = findRecent(file, 'missing', 24 * 3_600_000, () => 10_000);
      expect(out).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns an entry within the window', () => {
    const dir = freshDir();
    const file = join(dir, 'reported-fingerprints.json');
    const now = 1_000_000;
    try {
      recordReported(file, 'abc', 'https://x/1', () => now - 3_600_000);
      const out = findRecent(file, 'abc', 24 * 3_600_000, () => now);
      expect(out?.issueUrl).toBe('https://x/1');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignores entries older than the window', () => {
    const dir = freshDir();
    const file = join(dir, 'reported-fingerprints.json');
    const now = 100 * 86_400_000;
    try {
      writeFileSync(
        file,
        JSON.stringify({
          schemaVersion: 1,
          entries: [{ fingerprint: 'abc', ts: now - 25 * 3_600_000, issueUrl: 'https://x/old' }],
        }),
      );
      const out = findRecent(file, 'abc', 24 * 3_600_000, () => now);
      expect(out).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('writeAtomic', () => {
  it('creates the file when it does not exist', () => {
    const dir = freshDir();
    const file = join(dir, 'fp.json');
    try {
      writeAtomic(file, 'hello');
      expect(existsSync(file)).toBe(true);
      expect(readFileSync(file, 'utf8')).toBe('hello');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('replaces an existing file without leaving a .tmp sibling', () => {
    const dir = freshDir();
    const file = join(dir, 'fp.json');
    try {
      writeFileSync(file, 'old');
      writeAtomic(file, 'new');
      expect(readFileSync(file, 'utf8')).toBe('new');
      const leftover = readdirSync(dir).filter((n) => n.includes('.tmp.'));
      expect(leftover).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
