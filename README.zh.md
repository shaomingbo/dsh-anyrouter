# dsh-anyrouter

面向 [Any Router](https://anyrouter.top) 的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 专用提供方 bundle——Claude 走 Claude Code 兼容传输，GPT/Codex 走 Responses API。

## 安装（固定 release tag，免参数）

```bash
npx --yes github:shaomingbo/dsh-anyrouter#v0.3.1
```

安装器默认目标为 `web` profile，固定到精确 release tag，只修改 profile `package.json` 中的 `dependencies.dsh-anyrouter` 与 `dsh.profile.bundles`，随后在该目录执行 `pnpm install --ignore-scripts`，全程不停、不重启 DSH。结束后请手动重启 DSH 并强刷 Web 页面。

其他命令：

```bash
npx --yes github:shaomingbo/dsh-anyrouter#v0.3.1 status                    # 是否已安装
npx --yes github:shaomingbo/dsh-anyrouter#v0.3.1 uninstall                 # 幂等卸载
npx --yes github:shaomingbo/dsh-anyrouter#v0.3.1 --profile headless        # 指定其他 profile
DSH_ANYROUTER_SOURCE=link:/path/to/checkout npx --yes github:shaomingbo/dsh-anyrouter#v0.3.1   # 本地源码覆盖
```

## 兼容性

| DSH 版本 | 状态 |
|---|---|
| `0.1.2-alpha.3` | **已验证**（构建 + 启动 + 设置面板实测） |
| `0.1.1-rc.2` 及更早 | **不支持**：这些版本的 Client 通过 `connection.api` 暴露凭证与模型发现，`0.1.2-alpha.3` 已移除该入口并改用 `ctx.remote.credentials` / `ctx.remote.llm`。请改用 `v0.2.3` |
| 其他版本 | 未知，未经验证 |

Client 插件在启动时探测 `remote.credentials` / `remote.llm`；缺失时立即报错退出（面板不会静默空白），错误信息会写明支持范围。

## 功能

- **按 Key 启停路由。** 只有存在 API Key（凭证引用 `ANYROUTER_API_KEY`；未装凭证服务时取启动环境变量）时才注册 `anyrouter` 路由。没有 Key 提供方自动休眠——模型选择器整组消失；重新存入 Key 后无需重启即恢复。
- **同步的是完整模型档案，不只是模型 ID。** 每个同步模型都会持久化推理参数——可选力度（efforts）、默认力度、自适应思考标志——以及上下文/输出容量。模型选择器与推理力度选择器对每个模型都完整可用，且档案在同步界面可见、可改。
- **自行选择纳入哪些模型。** 「同步模型」把中继公布的 Claude/GPT 模型列为勾选清单；勾选子集、逐行调整推理档案后保存。`gpt-5-codex` 默认不勾选——Responses 端点对其返回 `404 当前 API 不支持所选模型`（2026-08-31 实测）。
- **Claude Code 请求指纹。** Claude 模型走 Claude Code 2.1.239 兼容的 Anthropic Messages 传输：beta 头/查询参数、Agent SDK 身份块、会话元数据形状、自适应思考、上下文管理与 Claude Code 规范工具名。
- **Codex Responses，而非 Chat Completions。** GPT 模型走 `POST /v1/responses`，请求形状对齐 Codex CLI（`store: false`、`include reasoning.encrypted_content`、codex user agent）。
- 推理力度经 DSH 常规推理选择器下发；API Key 存于专用凭证引用，浏览器可写可换、不可回读。

## 配置

持久化于 `llm-anyrouter` 设置分节：

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
        adaptive: true          # 仅 Claude：自适应 effort，替代思考预算
    - id: gpt-5.6-sol
      protocol: codex-responses
      reasoning:
        efforts: [off, low, medium, high]
        defaultEffort: high
```

省略 `reasoning` 时回退到由 pi-ai 目录生成的构建期参考档案（`src/model-profiles.generated.ts`）；`disabled: true` 表示该模型不提供推理控制。API Key 本体存于凭证服务（或启动环境变量），绝不进入该分节。

## 模型列表是建议性的

上游通道不可用或满载时，已同步模型仍可能返回 `429`/`500`——同步刻意不对每个模型做计费探测。错误会点名模型与状态码，稍后重试即可。

## 开发

```bash
pnpm install
pnpm run typecheck
pnpm run test        # vitest + node:test 安装器套件
pnpm run build       # 宿主 bundle + 浏览器客户端
pnpm run check       # 以上全部 + install.js 语法检查
node scripts/generate-model-profiles.mjs   # pi-ai 升级后重新生成并提交 diff
```

本地开发接入运行中的 profile：

```bash
DSH_ANYROUTER_SOURCE=link:/absolute/path/to/checkout npx --yes github:shaomingbo/dsh-anyrouter#v0.3.1
```

真实端点验证按环境变量门控，仅当导出 `ANYROUTER_LIVE_KEY` 时发起真实请求：

```bash
ANYROUTER_LIVE_KEY=sk-… pnpm vitest run tests/live.spec.ts
```

手动兜底（非首选路径）：自行向 profile `package.json` 添加依赖与 `dsh.profile.bundles` 条目，再在该目录执行 `pnpm install --ignore-scripts`。

## 兼容性

目标为 DeepSeek Harness `0.1.1-rc.2` 与 pi-ai `0.82.1`。若仍存在指向本中继的旧版 `llm-pi-ai.providers` 通用配置，请移除——专用路由拥有请求指纹。

## 许可

MIT
