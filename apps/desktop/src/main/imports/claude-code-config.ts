import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ProviderEntry } from '@open-codesign/shared';

export function claudeCodeSettingsPath(home: string = homedir()): string {
  return join(home, '.claude', 'settings.json');
}

export interface ClaudeCodeImport {
  provider: ProviderEntry | null;
  /** The API key pulled from env (if ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY
   * was inlined in settings.json). */
  apiKey: string | null;
  activeModel: string | null;
  warnings: string[];
}

type ClaudeCodeSettings = {
  env?: Record<string, string>;
};

export function parseClaudeCodeSettings(json: string): ClaudeCodeImport {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      provider: null,
      apiKey: null,
      activeModel: null,
      warnings: [`Claude Code settings.json is not valid JSON: ${msg}`],
    };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      provider: null,
      apiKey: null,
      activeModel: null,
      warnings: ['Claude Code settings.json has unexpected shape'],
    };
  }

  const settings = parsed as ClaudeCodeSettings;
  const env = settings.env ?? {};
  const baseUrl = env['ANTHROPIC_BASE_URL'] ?? 'https://api.anthropic.com';
  const model = env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-6';
  const apiKey = env['ANTHROPIC_AUTH_TOKEN'] ?? env['ANTHROPIC_API_KEY'] ?? null;

  const provider: ProviderEntry = {
    id: 'claude-code-imported',
    name: 'Claude Code (imported)',
    builtin: false,
    wire: 'anthropic',
    baseUrl,
    defaultModel: model,
  };

  if (apiKey === null) {
    warnings.push(
      'Claude Code settings.json did not inline ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY — you will need to paste the key manually.',
    );
  }

  return { provider, apiKey, activeModel: model, warnings };
}

export async function readClaudeCodeSettings(
  home: string = homedir(),
): Promise<ClaudeCodeImport | null> {
  const path = claudeCodeSettingsPath(home);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
  return parseClaudeCodeSettings(raw);
}
