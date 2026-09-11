import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('built plugin loads without legacy settings helpers (rc.1 API)', () => {
  const entry = new URL('../lib/index.js', import.meta.url).href
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `
    import { registerHooks } from 'node:module';
    const entry = ${JSON.stringify(entry)};
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier === '@deepseek-ai/dsh-settings' && context.parentURL === entry) {
          const actual = nextResolve(specifier, context).url;
          const facade = 'export { default, SettingsProvider, SettingsConflictError, redactSecrets } from ' + JSON.stringify(actual);
          return { url: 'data:text/javascript,' + encodeURIComponent(facade), shortCircuit: true };
        }
        return nextResolve(specifier, context);
      }
    });
    const plugin = await import(entry);
    if (plugin.name !== 'dsh-anyrouter' || typeof plugin.apply !== 'function') {
      throw new Error('invalid plugin entry');
    }
  `], { encoding: 'utf8', timeout: 15_000 })
  assert.equal(result.status, 0, result.stderr || String(result.error))
})
