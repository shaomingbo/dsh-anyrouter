# dsh-anyrouter

A dedicated [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) provider bundle for [Any Router](https://anyrouter.top) — Claude via a Claude Code compatible transport, GPT/Codex via the Responses API.

## Install (fixed release tag, no arguments)

```bash
npx --yes github:shaomingbo/dsh-anyrouter#v0.2.1
```

The installer defaults to the `web` profile, pins the exact release tag, edits only `dependencies.dsh-anyrouter` and `dsh.profile.bundles` in the profile `package.json`, runs `pnpm install --ignore-scripts` there, and never stops or restarts DSH. Restart DSH manually afterwards and hard-refresh the Web page.

Other commands:

```bash
npx --yes github:shaomingbo/dsh-anyrouter#v0.2.1 status                    # is it installed?
npx --yes github:shaomingbo/dsh-anyrouter#v0.2.1 uninstall                 # idempotent removal
npx --yes github:shaomingbo/dsh-anyrouter#v0.2.1 --profile headless        # another profile
DSH_ANYROUTER_SOURCE=link:/path/to/checkout npx --yes github:shaomingbo/dsh-anyrouter#v0.2.1   # local source override
```

## Features

- **Key-gated route.** The `anyrouter` provider route is registered only while an API key exists (credentials reference `ANYROUTER_API_KEY`, or the launch environment when no credentials service is installed). Without a key the provider goes dormant — the model selector drops the whole group — and it returns without a restart once the key is stored again.
- **Full model profiles, not bare ids.** Synchronizing a model persists its reasoning parameters — selectable efforts, default effort, adaptive-thinking flag — plus context/output capacities. The model selector and the reasoning selector therefore work for every synchronized model, and every value is user-editable in the picker.
- **Choose which models to include.** **同步模型** lists every Claude/GPT model the relay advertises as a checkbox picker; adopt a subset and edit each row's reasoning profile before saving. `gpt-5-codex` starts unchecked because the relay's Responses endpoint rejects it (`404 当前 API 不支持所选模型`, verified 2026-08-31).
- **Claude Code request identity.** Claude models ride a Claude Code 2.1.239-compatible Anthropic Messages transport: the beta header/query set, Agent SDK identity blocks, session metadata shape, adaptive thinking, context management, and canonical Claude Code tool names.
- **Codex Responses, not Chat Completions.** GPT models ride `POST /v1/responses` with the Codex CLI request shape (`store: false`, `include reasoning.encrypted_content`, codex user agent).
- Reasoning efforts flow through the normal DSH reasoning selector. The API key is stored under the dedicated credential reference; the browser can write or replace it but never reads it back.

## Configuration

Persisted under the `llm-anyrouter` settings namespace:

```yaml
llm-anyrouter:
  baseURL: https://anyrouter.top
  models:
    - id: claude-opus-5
      protocol: claude-code
      contextWindow: 1000000
      maxTokens: 128000
      reasoning:
        efforts: [off, minimal, low, medium, high, xhigh, max]
        defaultEffort: high
        adaptive: true          # Claude only: adaptive effort instead of a thinking budget
    - id: gpt-5.6-sol
      protocol: codex-responses
      reasoning:
        efforts: [off, low, medium, high]
        defaultEffort: high
```

An absent `reasoning` block falls back to the build-time reference profile generated from pi-ai's catalog (`src/model-profiles.generated.ts`); `disabled: true` offers the model without a reasoning control. The API key itself lives in the credentials service (or the launch environment), never in this section.

## The model list is advisory

A synchronized model can still answer `429`/`500` when the relay has no healthy upstream channel or is at capacity — synchronization deliberately makes no paid probe calls per model. Errors name the model and status; retry later.

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run test        # vitest + node:test installer suites
pnpm run build       # host bundle + browser client
pnpm run check       # everything above + install.js syntax check
node scripts/generate-model-profiles.mjs   # regenerate after a pi-ai bump; commit the diff
```

Local development against a running profile:

```bash
DSH_ANYROUTER_SOURCE=link:/absolute/path/to/checkout npx --yes github:shaomingbo/dsh-anyrouter#v0.2.1
```

Live endpoint verification is environment-gated and makes real requests only when `ANYROUTER_LIVE_KEY` is exported:

```bash
ANYROUTER_LIVE_KEY=sk-… pnpm vitest run tests/live.spec.ts
```

Manual fallback (not the preferred path): add the dependency and the `dsh.profile.bundles` entry to the profile `package.json` yourself, then run `pnpm install --ignore-scripts` in the profile directory.

## Compatibility

Targets DeepSeek Harness `0.1.1-rc.2` and pi-ai `0.82.1`. If a legacy generic `llm-pi-ai.providers` profile still points at this relay, remove it — the dedicated route owns the request identity.

## License

MIT
