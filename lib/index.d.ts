import { LlmDiscoveredModel, ResolvedRetryPolicy, RetryPolicyConfig } from "@deepseek-ai/dsh-llm";
import { ProviderStreams } from "@earendil-works/pi-ai";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";
import z from "@deepseek-ai/schemastery";
import { CredentialRef } from "@deepseek-ai/dsh-credentials";
import { Context } from "@deepseek-ai/cordis";
import { AttachmentStore } from "@deepseek-ai/dsh-attachment";
//#region src/config.d.ts
declare const REASONING_LEVELS: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
type ReasoningLevel = (typeof REASONING_LEVELS)[number];
type AnyRouterProtocol = 'claude-code' | 'codex-responses';
/**
 * Persisted reasoning profile for one synchronized model. `efforts` is the
 * authoritative enable flag: an empty (or absent) list keeps whatever the
 * generated reference profile says, and a non-empty list replaces it.
 */
interface ReasoningProfile {
  /** Explicitly offer the model without a reasoning control. */
  disabled?: boolean;
  /** Selectable levels in canonical order; empty falls back to the reference. */
  efforts?: ReasoningLevel[];
  /** Level the model selector marks as default; must be one of `efforts`. */
  defaultEffort?: ReasoningLevel;
  /** Claude-only: send adaptive `effort` instead of a thinking budget. */
  adaptive?: boolean;
}
interface AnyRouterModelConfig {
  id: string;
  name?: string;
  protocol: AnyRouterProtocol;
  contextWindow?: number;
  maxTokens?: number;
  reasoning?: ReasoningProfile;
}
interface Config {
  apiKeyEnv?: string;
  baseURL?: string;
  models?: AnyRouterModelConfig[];
  streamIdleTimeoutMs?: number;
  retryPolicy?: RetryPolicyConfig;
}
interface ResolvedConfig {
  apiKeyEnv: CredentialRef;
  baseURL: string;
  models: readonly AnyRouterModelConfig[];
  streamIdleTimeoutMs: number;
  retryPolicy: ResolvedRetryPolicy;
}
declare const Config: z<Config>;
declare function resolveConfig(config: Config): ResolvedConfig;
//#endregion
//#region src/adapter.d.ts
declare class AnyRouterAdapter extends PiAiAdapter {
  constructor(options: {
    config: () => ResolvedConfig;
    resolveApiKey: (ref: CredentialRef) => Promise<string>;
    resolveAttachments?: () => AttachmentStore | undefined;
  });
  private readonly modelOptions;
  /**
   * Surface the per-model default effort the persisted reasoning profile
   * carries. The generic adapter can only mark a profile-wide default, which
   * for a multi-model route like this one would be wrong for every model but
   * one; patching the resolved info keeps the selector's marked default equal
   * to what the settings section saved.
   */
  resolveModel(provider: string, model: string, signal?: AbortSignal): Promise<import("@deepseek-ai/dsh-llm").LlmResolvedModelInfo>;
}
//#endregion
//#region src/discovery.d.ts
declare function discoverAnyRouterModels(options: {
  baseURL: string;
  apiKey: string;
  signal?: AbortSignal;
  fetch?: typeof fetch;
}): Promise<LlmDiscoveredModel[]>;
//#endregion
//#region src/transports/claude.d.ts
declare const claudeCodeStreams: ProviderStreams;
//#endregion
//#region src/transports/codex.d.ts
declare const codexResponsesStreams: ProviderStreams;
//#endregion
//#region src/index.d.ts
declare const name = "dsh-anyrouter";
declare const inject: string[];
declare function apply(ctx: Context, config: Config): void;
//#endregion
export { AnyRouterAdapter, type AnyRouterModelConfig, type AnyRouterProtocol, Config, type ResolvedConfig, apply, claudeCodeStreams, codexResponsesStreams, discoverAnyRouterModels, inject, name, resolveConfig };
//# sourceMappingURL=index.d.ts.map