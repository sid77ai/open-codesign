import { describe, expect, it } from 'vitest';
import { parseCodexConfig } from './codex-config';

describe('parseCodexConfig', () => {
  it('returns empty providers on empty TOML', () => {
    const out = parseCodexConfig('');
    expect(out.providers).toEqual([]);
    expect(out.activeProvider).toBeNull();
  });

  it('translates a DeepSeek block to an openai-chat ProviderEntry', () => {
    const toml = `
model = "deepseek-chat"
model_provider = "deepseek"

[model_providers.deepseek]
name = "DeepSeek"
base_url = "https://api.deepseek.com/v1"
env_key = "DEEPSEEK_API_KEY"
wire_api = "chat"
`;
    const out = parseCodexConfig(toml);
    expect(out.providers).toHaveLength(1);
    const entry = out.providers[0];
    expect(entry?.id).toBe('codex-deepseek');
    expect(entry?.wire).toBe('openai-chat');
    expect(entry?.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(entry?.envKey).toBe('DEEPSEEK_API_KEY');
    expect(entry?.defaultModel).toBe('deepseek-chat');
    expect(out.activeProvider).toBe('codex-deepseek');
    expect(out.activeModel).toBe('deepseek-chat');
  });

  it('maps wire_api="responses" to openai-responses', () => {
    const toml = `
[model_providers.azure]
base_url = "https://org.openai.azure.com/openai"
wire_api = "responses"

[model_providers.azure.query_params]
"api-version" = "2025-04-01-preview"
`;
    const out = parseCodexConfig(toml);
    expect(out.providers[0]?.wire).toBe('openai-responses');
    expect(out.providers[0]?.queryParams?.['api-version']).toBe('2025-04-01-preview');
  });

  it('skips provider blocks missing base_url with a warning', () => {
    const toml = `
[model_providers.bad]
name = "No URL"
`;
    const out = parseCodexConfig(toml);
    expect(out.providers).toEqual([]);
    expect(out.warnings.join('\n')).toMatch(/bad.*missing base_url/);
  });

  it('returns a warning on bad TOML', () => {
    const out = parseCodexConfig('this is not toml = [');
    expect(out.providers).toEqual([]);
    expect(out.warnings[0]).toMatch(/not valid TOML/);
  });

  it('infers wire from base_url when wire_api is absent', () => {
    const toml = `
[model_providers.claude_gateway]
base_url = "https://proxy.anthropic.example.com"
`;
    const out = parseCodexConfig(toml);
    expect(out.providers[0]?.wire).toBe('anthropic');
  });
});
