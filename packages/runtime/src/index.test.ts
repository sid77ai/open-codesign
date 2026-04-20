import { describe, expect, it } from 'vitest';
import { buildSrcdoc, extractAndUpgradeArtifact } from './index';

describe('buildSrcdoc', () => {
  it('strips CSP meta tags', () => {
    const html =
      '<html><head><meta http-equiv="Content-Security-Policy" content="default-src none"></head><body></body></html>';
    const out = buildSrcdoc(html);
    expect(out).not.toContain('Content-Security-Policy');
  });

  it('passes legacy full-HTML documents through verbatim (pre-JSX-only snapshots)', () => {
    // Snapshots written before the JSX-only switchover contain raw HTML
    // documents. Wrapping those as JSX makes Babel bark on the DOCTYPE /
    // <html> tokens, so buildSrcdoc short-circuits when it detects a
    // full HTML document and returns it unchanged.
    const html = '<html><body><p>x</p></body></html>';
    expect(buildSrcdoc(html)).toBe(html);
    const doctyped = '<!DOCTYPE html><html><body><p>y</p></body></html>';
    expect(buildSrcdoc(doctyped)).toBe(doctyped);
  });

  it('wraps a fragment via the JSX path (no legacy HTML branch)', () => {
    const out = buildSrcdoc('<div>plain</div>');
    expect(out).toContain('AGENT_BODY_BEGIN');
    expect(out).toContain('<script type="text/babel"');
    expect(out).toContain('<div>plain</div>');
  });
});

describe('buildSrcdoc — JSX path', () => {
  const jsxArtifact = `const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"a":1}/*EDITMODE-END*/;
function App() { return <div>hi</div>; }
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);`;

  it('routes JSX artifacts through the React+Babel template', () => {
    const out = buildSrcdoc(jsxArtifact);
    expect(out).toContain('AGENT_BODY_BEGIN');
    expect(out).toContain('AGENT_BODY_END');
    expect(out).toContain('text/babel');
    // Vendored runtime + frame snippets must be inlined.
    expect(out).toContain('IOSDevice');
    expect(out).toContain('DesignCanvas');
    // Overlay still present so element-selection / error reporting work.
    expect(out).toContain('ELEMENT_SELECTED');
    // The agent's payload is embedded between the markers.
    expect(out).toContain('TWEAK_DEFAULTS');
  });

  it('detects JSX via ReactDOM.createRoot signature even without EDITMODE', () => {
    const src = `function App() { return <div/>; } ReactDOM.createRoot(document.getElementById("root")).render(<App/>);`;
    const out = buildSrcdoc(src);
    expect(out).toContain('AGENT_BODY_BEGIN');
  });

  it('extractAndUpgradeArtifact wraps JSX payloads', () => {
    const wrapped = extractAndUpgradeArtifact(jsxArtifact);
    expect(wrapped).toContain('AGENT_BODY_BEGIN');
    expect(wrapped).toContain('TWEAK_DEFAULTS');
  });

  it('extractAndUpgradeArtifact also wraps bare HTML (JSX-only contract)', () => {
    const wrapped = extractAndUpgradeArtifact('<html><body>x</body></html>');
    expect(wrapped).toContain('AGENT_BODY_BEGIN');
    expect(wrapped).toContain('<script type="text/babel"');
  });

  it('extractAndUpgradeArtifact passes already-wrapped payloads through unchanged', () => {
    const wrapped = extractAndUpgradeArtifact(jsxArtifact);
    const wrappedTwice = extractAndUpgradeArtifact(wrapped);
    expect(wrappedTwice).toBe(wrapped);
  });

  it('buildSrcdoc passes already-wrapped payloads through unchanged', () => {
    const wrapped = buildSrcdoc(jsxArtifact);
    const wrappedTwice = buildSrcdoc(wrapped);
    expect(wrappedTwice).toBe(wrapped);
  });
});
