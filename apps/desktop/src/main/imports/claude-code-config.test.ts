import { describe, expect, it } from 'vitest';
import { parseClaudeCodeSettings } from './claude-code-config';

describe('parseClaudeCodeSettings', () => {
  it('creates a single anthropic ProviderEntry from ANTHROPIC_BASE_URL + MODEL', () => {
    const json = JSON.stringify({
      env: {
        ANTHROPIC_BASE_URL: 'https://gateway.example.com',
        ANTHROPIC_MODEL: 'claude-opus-4-1',
        ANTHROPIC_AUTH_TOKEN: 'sk-ant-test',
      },
    });
    const out = parseClaudeCodeSettings(json);
    expect(out.provider?.id).toBe('claude-code-imported');
    expect(out.provider?.wire).toBe('anthropic');
    expect(out.provider?.baseUrl).toBe('https://gateway.example.com');
    expect(out.provider?.defaultModel).toBe('claude-opus-4-1');
    expect(out.apiKey).toBe('sk-ant-test');
  });

  it('accepts ANTHROPIC_API_KEY as a fallback to ANTHROPIC_AUTH_TOKEN', () => {
    const json = JSON.stringify({ env: { ANTHROPIC_API_KEY: 'k' } });
    const out = parseClaudeCodeSettings(json);
    expect(out.apiKey).toBe('k');
  });

  it('warns when no key is present but still returns a provider', () => {
    const json = JSON.stringify({ env: {} });
    const out = parseClaudeCodeSettings(json);
    expect(out.provider).not.toBeNull();
    expect(out.apiKey).toBeNull();
    expect(out.warnings.join(' ')).toMatch(/manually/);
  });

  it('returns a warning on non-JSON input', () => {
    const out = parseClaudeCodeSettings('{ bad json');
    expect(out.provider).toBeNull();
    expect(out.warnings[0]).toMatch(/not valid JSON/);
  });
});
