import { build } from 'esbuild'

const pluginId = 'dsh-anyrouter'

await build({
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  external: [
    'react',
    'react/jsx-runtime',
    '@deepseek-ai/dsh-api-remotes/client',
    '@deepseek-ai/dsh-client-ui-settings/client',
  ],
  banner: {
    js: `window.__ModuleLoader__.load({id:${JSON.stringify(pluginId)},factory:(require)=>{const module={exports:{}};const exports=module.exports;`,
  },
  footer: {
    js: 'return module.exports;}});',
  },
})
