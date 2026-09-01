window.__ModuleLoader__.load({id:"dsh-anyrouter",factory:(require)=>{const module={exports:{}};const exports=module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");

// src/model-profiles.generated.ts
var MODEL_PROFILES = [
  { id: "claude-3-5-haiku", protocol: "claude-code", name: "Claude Haiku 3.5 (latest)", efforts: [], adaptive: false, contextWindow: 2e5, maxTokens: 8192, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-3-haiku", protocol: "claude-code", name: "Claude Haiku 3", efforts: [], adaptive: false, contextWindow: 2e5, maxTokens: 4096, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-3-opus", protocol: "claude-code", name: "Claude Opus 3", efforts: [], adaptive: false, contextWindow: 2e5, maxTokens: 4096, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-3-sonnet", protocol: "claude-code", name: "Claude Sonnet 3", efforts: [], adaptive: false, contextWindow: 2e5, maxTokens: 4096, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-3.5-haiku", protocol: "claude-code", name: "Claude Haiku 3.5 (latest)", efforts: [], adaptive: false, contextWindow: 2e5, maxTokens: 8192, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-3.5-sonnet", protocol: "claude-code", name: "Claude Sonnet 3.5 v2", efforts: [], adaptive: false, contextWindow: 2e5, maxTokens: 8192, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-fable-5", protocol: "claude-code", name: "Claude Fable 5", efforts: ["minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsStrictTools": true } },
  { id: "claude-haiku-4-5", protocol: "claude-code", name: "Claude Haiku 4.5 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 64e3, compat: { "supportsStrictTools": true } },
  { id: "claude-haiku-4-5-20251001", protocol: "claude-code", name: "Claude Haiku 4.5", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 64e3, compat: { "supportsStrictTools": true } },
  { id: "claude-haiku-4.5", protocol: "claude-code", name: "Claude Haiku 4.5 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 64e3, compat: { "supportsEagerToolInputStreaming": false } },
  { id: "claude-opus-4", protocol: "claude-code", name: "Claude Opus 4 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 32e3, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-opus-4-1", protocol: "claude-code", name: "Claude Opus 4.1 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 32e3, compat: { "supportsStrictTools": true } },
  { id: "claude-opus-4-1-20250805", protocol: "claude-code", name: "Claude Opus 4.1", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 32e3, compat: { "supportsStrictTools": true } },
  { id: "claude-opus-4-5", protocol: "claude-code", name: "Claude Opus 4.5 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 64e3, compat: { "supportsStrictTools": true } },
  { id: "claude-opus-4-5-20251101", protocol: "claude-code", name: "Claude Opus 4.5", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 64e3, compat: { "supportsStrictTools": true } },
  { id: "claude-opus-4-6", protocol: "claude-code", name: "Claude Opus 4.6", efforts: ["off", "minimal", "low", "medium", "high", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsStrictTools": true } },
  { id: "claude-opus-4-7", protocol: "claude-code", name: "Claude Opus 4.7", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsTemperature": false, "supportsStrictTools": true } },
  { id: "claude-opus-4-8", protocol: "claude-code", name: "Claude Opus 4.8", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsTemperature": false, "supportsStrictTools": true } },
  { id: "claude-opus-4.5", protocol: "claude-code", name: "Claude Opus 4.5 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 32e3 },
  { id: "claude-opus-4.6", protocol: "claude-code", name: "Claude Opus 4.6", efforts: ["off", "minimal", "low", "medium", "high", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 32e3, compat: { "forceAdaptiveThinking": true } },
  { id: "claude-opus-4.7", protocol: "claude-code", name: "Claude Opus 4.7", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 32e3, compat: { "forceAdaptiveThinking": true, "supportsTemperature": false } },
  { id: "claude-opus-4.8", protocol: "claude-code", name: "Claude Opus 4.8", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 64e3, compat: { "forceAdaptiveThinking": true, "supportsTemperature": false } },
  { id: "claude-opus-5", protocol: "claude-code", name: "Claude Opus 5", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsTemperature": false, "supportsStrictTools": true } },
  { id: "claude-sonnet-4", protocol: "claude-code", name: "Claude Sonnet 4 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 64e3, compat: { "sendSessionAffinityHeaders": true } },
  { id: "claude-sonnet-4-5", protocol: "claude-code", name: "Claude Sonnet 4.5 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 1e6, maxTokens: 64e3, compat: { "supportsStrictTools": true } },
  { id: "claude-sonnet-4-5-20250929", protocol: "claude-code", name: "Claude Sonnet 4.5", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 1e6, maxTokens: 64e3, compat: { "supportsStrictTools": true } },
  { id: "claude-sonnet-4-6", protocol: "claude-code", name: "Claude Sonnet 4.6", efforts: ["off", "minimal", "low", "medium", "high", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsStrictTools": true } },
  { id: "claude-sonnet-4.5", protocol: "claude-code", name: "Claude Sonnet 4.5 (latest)", efforts: ["off", "minimal", "low", "medium", "high"], adaptive: false, contextWindow: 2e5, maxTokens: 32e3, compat: { "supportsEagerToolInputStreaming": false } },
  { id: "claude-sonnet-4.6", protocol: "claude-code", name: "Claude Sonnet 4.6", efforts: ["off", "minimal", "low", "medium", "high", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 32e3, compat: { "forceAdaptiveThinking": true } },
  { id: "claude-sonnet-5", protocol: "claude-code", name: "Claude Sonnet 5", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: true, contextWindow: 1e6, maxTokens: 128e3, compat: { "forceAdaptiveThinking": true, "supportsStrictTools": true } },
  { id: "gpt-4", protocol: "codex-responses", name: "GPT-4", efforts: [], adaptive: false, contextWindow: 8192, maxTokens: 8192, compat: { "supportsStrictMode": true } },
  { id: "gpt-4-turbo", protocol: "codex-responses", name: "GPT-4 Turbo", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 4096, compat: { "supportsStrictMode": true } },
  { id: "gpt-4.1", protocol: "codex-responses", name: "GPT-4.1", efforts: [], adaptive: false, contextWindow: 1047576, maxTokens: 32768, compat: { "supportsStrictMode": true } },
  { id: "gpt-4.1-mini", protocol: "codex-responses", name: "GPT-4.1 mini", efforts: [], adaptive: false, contextWindow: 1047576, maxTokens: 32768, compat: { "supportsStrictMode": true } },
  { id: "gpt-4.1-nano", protocol: "codex-responses", name: "GPT-4.1 nano", efforts: [], adaptive: false, contextWindow: 1047576, maxTokens: 32768, compat: { "supportsStrictMode": true } },
  { id: "gpt-4o", protocol: "codex-responses", name: "GPT-4o", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true } },
  { id: "gpt-4o-2024-05-13", protocol: "codex-responses", name: "GPT-4o (2024-05-13)", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 4096, compat: { "supportsStrictMode": true } },
  { id: "gpt-4o-2024-08-06", protocol: "codex-responses", name: "GPT-4o (2024-08-06)", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true } },
  { id: "gpt-4o-2024-11-20", protocol: "codex-responses", name: "GPT-4o (2024-11-20)", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true } },
  { id: "gpt-4o-mini", protocol: "codex-responses", name: "GPT-4o mini", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true } },
  { id: "gpt-5", protocol: "codex-responses", name: "GPT-5", efforts: ["minimal", "low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5-chat-latest", protocol: "codex-responses", name: "GPT-5 Chat Latest", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5-codex", protocol: "codex-responses", name: "GPT-5 Codex", efforts: ["low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "sessionAffinityFormat": "openai-nosession", "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5-mini", protocol: "codex-responses", name: "GPT-5 Mini", efforts: ["minimal", "low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5-nano", protocol: "codex-responses", name: "GPT-5 Nano", efforts: ["minimal", "low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5-pro", protocol: "codex-responses", name: "GPT-5 Pro", efforts: ["high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.1", protocol: "codex-responses", name: "GPT-5.1", efforts: ["off", "low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.1-codex", protocol: "codex-responses", name: "GPT-5.1 Codex", efforts: ["low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.1-codex-max", protocol: "codex-responses", name: "GPT-5.1 Codex Max", efforts: ["low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "sessionAffinityFormat": "openai-nosession", "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.1-codex-mini", protocol: "codex-responses", name: "GPT-5.1 Codex Mini", efforts: ["low", "medium", "high"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "sessionAffinityFormat": "openai-nosession", "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.2", protocol: "codex-responses", name: "GPT-5.2", efforts: ["off", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.2-chat-latest", protocol: "codex-responses", name: "GPT-5.2 Chat", efforts: ["medium", "xhigh"], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.2-codex", protocol: "codex-responses", name: "GPT-5.2 Codex", efforts: ["low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.2-pro", protocol: "codex-responses", name: "GPT-5.2 Pro", efforts: ["medium", "high", "xhigh"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.3-chat-latest", protocol: "codex-responses", name: "GPT-5.3 Chat (latest)", efforts: [], adaptive: false, contextWindow: 128e3, maxTokens: 16384, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.3-codex", protocol: "codex-responses", name: "GPT-5.3 Codex", efforts: ["off", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.3-codex-spark", protocol: "codex-responses", name: "GPT-5.3 Codex Spark", efforts: ["off", "minimal", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 128e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.4", protocol: "codex-responses", name: "GPT-5.4", efforts: ["off", "minimal", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 272e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-5.4-mini", protocol: "codex-responses", name: "GPT-5.4 mini", efforts: ["off", "minimal", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 272e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-5.4-nano", protocol: "codex-responses", name: "GPT-5.4 nano", efforts: ["off", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 4e5, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.4-pro", protocol: "codex-responses", name: "GPT-5.4 Pro", efforts: ["medium", "high", "xhigh"], adaptive: false, contextWindow: 105e4, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-5.5", protocol: "codex-responses", name: "GPT-5.5", efforts: ["off", "minimal", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 272e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-5.5-pro", protocol: "codex-responses", name: "GPT-5.5 Pro", efforts: ["medium", "high", "xhigh"], adaptive: false, contextWindow: 105e4, maxTokens: 128e3, compat: { "supportsStrictMode": true, "supportsOpenAIGrammarTools": true } },
  { id: "gpt-5.6-luna", protocol: "codex-responses", name: "GPT-5.6 Luna", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: false, contextWindow: 272e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-5.6-sol", protocol: "codex-responses", name: "GPT-5.6 Sol", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: false, contextWindow: 272e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-5.6-terra", protocol: "codex-responses", name: "GPT-5.6 Terra", efforts: ["off", "minimal", "low", "medium", "high", "xhigh", "max"], adaptive: false, contextWindow: 272e3, maxTokens: 128e3, compat: { "supportsOpenAIGrammarTools": true, "supportsToolSearch": true } },
  { id: "gpt-realtime-2.1", protocol: "codex-responses", name: "GPT-Realtime-2.1", efforts: ["minimal", "low", "medium", "high", "xhigh"], adaptive: false, contextWindow: 128e3, maxTokens: 32e3, compat: { "supportsStrictMode": true } }
];
var MODEL_PROFILES_BY_ID = new Map(
  MODEL_PROFILES.map((profile) => [profile.id, profile])
);

// src/client/index.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var SETTINGS_NS = "llm-anyrouter";
var PROVIDER = "anyrouter";
var API_KEY_REF = "ANYROUTER_API_KEY";
var DEFAULT_BASE_URL = "https://anyrouter.top";
var LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
function errorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error;
    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.code === "string") return candidate.code;
  }
  return String(error);
}
function unwrapRemote(response) {
  const envelope = response;
  if (envelope !== null && envelope !== void 0 && envelope.ok === true) return envelope.value;
  throw new Error(errorMessage(envelope?.error));
}
function protocolFor(id) {
  const normalized = id.toLowerCase();
  if (normalized.startsWith("claude-")) return "claude-code";
  if (normalized.startsWith("gpt-")) return "codex-responses";
  return void 0;
}
var DEFAULT_UNCHECKED = /* @__PURE__ */ new Set(["gpt-5-codex"]);
function orderedLevels(levels) {
  const selected = new Set(levels);
  return LEVELS.filter((level) => selected.has(level));
}
function referenceRow(id, protocol) {
  const reference = MODEL_PROFILES_BY_ID.get(id);
  const referenceEfforts = orderedLevels(
    (reference?.efforts ?? []).filter((level) => LEVELS.includes(level))
  );
  const efforts = referenceEfforts.length > 0 ? referenceEfforts : [...LEVELS];
  const defaultEffort = efforts.includes("high") ? "high" : efforts[efforts.length - 1];
  return {
    id,
    ...reference?.name === void 0 ? {} : { name: reference.name },
    protocol,
    ...reference?.contextWindow === void 0 ? {} : { contextWindow: reference.contextWindow },
    ...reference?.maxTokens === void 0 ? {} : { maxTokens: reference.maxTokens },
    checked: !DEFAULT_UNCHECKED.has(id),
    reasoningOn: true,
    efforts,
    defaultEffort,
    adaptive: protocol === "claude-code" && (reference?.adaptive ?? true)
  };
}
function rowFromSaved(saved) {
  const base = referenceRow(saved.id, saved.protocol);
  const reasoning = saved.reasoning;
  const savedEfforts = reasoning?.efforts === void 0 ? [] : orderedLevels(reasoning.efforts);
  return {
    ...base,
    ...saved.name === void 0 ? {} : { name: saved.name },
    ...saved.contextWindow === void 0 ? {} : { contextWindow: saved.contextWindow },
    ...saved.maxTokens === void 0 ? {} : { maxTokens: saved.maxTokens },
    checked: true,
    reasoningOn: reasoning?.disabled !== true,
    ...savedEfforts.length > 0 ? { efforts: savedEfforts } : {},
    defaultEffort: reasoning?.defaultEffort !== void 0 && (savedEfforts.length > 0 ? savedEfforts : base.efforts).includes(reasoning.defaultEffort) ? reasoning.defaultEffort : base.defaultEffort,
    adaptive: saved.protocol === "claude-code" ? reasoning?.adaptive ?? base.adaptive : base.adaptive
  };
}
function rowToSaved(row) {
  return {
    id: row.id,
    ...row.name === void 0 ? {} : { name: row.name },
    protocol: row.protocol,
    ...row.contextWindow === void 0 ? {} : { contextWindow: row.contextWindow },
    ...row.maxTokens === void 0 ? {} : { maxTokens: row.maxTokens },
    reasoning: {
      ...!row.reasoningOn ? { disabled: true } : {},
      ...row.reasoningOn && row.efforts.length > 0 ? { efforts: orderedLevels(row.efforts) } : {},
      ...row.reasoningOn && row.defaultEffort !== void 0 && row.efforts.includes(row.defaultEffort) ? { defaultEffort: row.defaultEffort } : {},
      ...row.reasoningOn && row.protocol === "claude-code" ? { adaptive: row.adaptive } : {}
    }
  };
}
var styles = `
.dsh-any { color: var(--dsw-alias-label-primary, #0f1115); max-width: 880px; padding: 8px 4px 28px; }
.dsh-any h2 { margin: 0 0 8px; font-size: 22px; }
.dsh-any p { color: var(--dsw-alias-label-secondary, #61666b); line-height: 1.55; }
.dsh-any-card { background: var(--dsw-alias-bg-module-platform, #f5f6f7); border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, .04)); border-radius: 12px; padding: 18px; margin-top: 16px; }
.dsh-any-field { display: grid; gap: 7px; margin-top: 14px; }
.dsh-any-field label { font-size: 13px; color: var(--dsw-alias-label-secondary, #61666b); }
.dsh-any-field input { width: 100%; box-sizing: border-box; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, .12)); background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #0f1115); padding: 10px 12px; }
.dsh-any-field input::placeholder { color: var(--dsw-alias-label-dimmed, #e1e5ee); }
.dsh-any-field input:focus-visible { outline: 2px solid var(--dsw-alias-button-primary-hover, #43454a); outline-offset: 1px; }
.dsh-any-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.dsh-any button { border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)); border-radius: 8px; background: var(--dsw-alias-button-elevated-fill, #fff); color: var(--dsw-alias-label-primary, #0f1115); padding: 9px 14px; cursor: pointer; }
.dsh-any button:hover:enabled { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, .06)); }
.dsh-any button:focus-visible { outline: 2px solid var(--dsw-alias-button-primary-hover, #43454a); outline-offset: 1px; }
.dsh-any button[data-primary=true] { background: var(--dsw-alias-button-primary-fill, #0f1115); border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); }
.dsh-any button[data-primary=true]:hover:enabled { background: var(--dsw-alias-button-primary-hover, #43454a); }
.dsh-any button:disabled { opacity: .5; cursor: default; }
.dsh-any-status { display: inline-flex; gap: 7px; align-items: center; font-size: 13px; color: var(--dsw-alias-label-secondary, #61666b); }
.dsh-any-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-error-primary, #ec1313); }
.dsh-any-dot[data-ready=true] { background: var(--dsw-alias-state-success-primary, #22c55e); }
.dsh-any-error { margin-top: 12px; color: var(--dsw-alias-state-error-primary, #ec1313); white-space: pre-wrap; }
.dsh-any-success { margin-top: 12px; color: var(--dsw-alias-state-success-primary, #22c55e); }
.dsh-any-models { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 7px; }
.dsh-any-models li { display: flex; gap: 10px; justify-content: space-between; align-items: center; padding: 9px 10px; border-radius: 8px; background: var(--dsw-alias-bg-base, #fff); }
.dsh-any-model-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-any-badge { flex: none; font-size: 11px; border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)); border-radius: 99px; padding: 3px 7px; color: var(--dsw-alias-label-secondary, #61666b); }
.dsh-any-picker { margin-top: 14px; display: grid; gap: 8px; }
.dsh-any-row { border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, .1)); border-radius: 10px; padding: 10px 12px; background: var(--dsw-alias-bg-base, #fff); }
.dsh-any-row[data-checked=false] { opacity: .62; }
.dsh-any-row-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dsh-any-row-head label { flex: 1; min-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.dsh-any-row-meta { font-size: 12px; color: var(--dsw-alias-label-tertiary, #81858c); }
.dsh-any-levels { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 9px; }
.dsh-any-levels button { padding: 4px 9px; font-size: 12px; border-radius: 99px; }
.dsh-any-levels button[data-on=true] { background: var(--dsw-alias-button-primary-fill, #0f1115); border-color: transparent; color: var(--dsw-alias-label-primary-foreground, #fff); }
.dsh-any-levels button[data-on=true]:hover:enabled { background: var(--dsw-alias-button-primary-hover, #43454a); }
.dsh-any-levels select { border-radius: 8px; border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, .12)); background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #0f1115); padding: 4px 8px; }
.dsh-any-empty { margin-top: 10px; font-size: 13px; color: var(--dsw-alias-label-caption, #adb2b8); }
`;
function LevelChips({ row, onChange }) {
  if (!row.reasoningOn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {});
  const toggle = (level) => {
    const next = row.efforts.includes(level) ? row.efforts.filter((candidate) => candidate !== level) : orderedLevels([...row.efforts, level]);
    onChange({
      ...row,
      efforts: next,
      defaultEffort: row.defaultEffort !== void 0 && next.includes(row.defaultEffort) ? row.defaultEffort : next[next.length - 1]
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-levels", "data-testid": "reasoning-editor", children: [
    LEVELS.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        "data-on": row.efforts.includes(level),
        disabled: !row.checked,
        onClick: () => toggle(level),
        children: level
      },
      level
    )),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      " \u9ED8\u8BA4 ",
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "select",
        {
          disabled: !row.checked || row.efforts.length === 0,
          value: row.defaultEffort ?? "",
          onChange: (event) => onChange({
            ...row,
            defaultEffort: event.target.value === "" ? void 0 : event.target.value
          }),
          children: [
            row.defaultEffort === void 0 || !row.efforts.includes(row.defaultEffort) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "" }) : null,
            row.efforts.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: level, children: level }, level))
          ]
        }
      )
    ] }),
    row.protocol === "claude-code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "checkbox",
          disabled: !row.checked,
          checked: row.adaptive,
          onChange: (event) => onChange({ ...row, adaptive: event.target.checked })
        }
      ),
      " \u81EA\u9002\u5E94\u601D\u8003"
    ] }) : null
  ] });
}
function Picker({ rows, onChange }) {
  const update = (row) => onChange(rows.map((candidate) => candidate.id === row.id ? row : candidate));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-any-picker", "data-testid": "model-picker", children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-row", "data-checked": row.checked, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-row-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { title: row.id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: row.checked,
            onChange: (event) => update({ ...row, checked: event.target.checked })
          }
        ),
        " ",
        row.name ?? row.id
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-badge", children: row.protocol === "claude-code" ? "Claude" : "Codex" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-row-meta", children: `${Math.round((row.contextWindow ?? 0) / 1e3)}k ctx \xB7 ${Math.round((row.maxTokens ?? 0) / 1e3)}k out` })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-any-levels", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "checkbox",
          disabled: !row.checked,
          checked: row.reasoningOn,
          onChange: (event) => update({ ...row, reasoningOn: event.target.checked })
        }
      ),
      " \u63A8\u7406"
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelChips, { row, onChange: update })
  ] }, row.id)) });
}
function ReasoningSummary({ model }) {
  const reasoning = model.reasoning;
  if (reasoning === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-badge", children: "\u63A8\u7406 \xB7 \u53C2\u8003\u9ED8\u8BA4" });
  }
  if (reasoning.disabled === true) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-badge", children: "\u65E0\u63A8\u7406" });
  }
  const efforts = reasoning.efforts?.length ? reasoning.efforts.join("/") : "\u53C2\u8003\u9ED8\u8BA4";
  const suffix = reasoning.defaultEffort === void 0 ? "" : ` \xB7 \u9ED8\u8BA4 ${reasoning.defaultEffort}`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-badge", children: `\u63A8\u7406 ${efforts}${suffix}` });
}
function Section({ ops, scope, subscribeCredentials }) {
  const snapshot = (0, import_react.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot()
  );
  const models = Array.isArray(snapshot.value?.models) ? snapshot.value.models : [];
  const loading = snapshot.status === "loading";
  const writable = snapshot.status === "ready" && snapshot.writable && snapshot.mode === "host";
  const [configured, setConfigured] = (0, import_react.useState)(false);
  const [apiKey, setApiKey] = (0, import_react.useState)("");
  const [baseURL, setBaseURL] = (0, import_react.useState)(DEFAULT_BASE_URL);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [success, setSuccess] = (0, import_react.useState)(null);
  const [credentialRevision, setCredentialRevision] = (0, import_react.useState)(0);
  const [picker, setPicker] = (0, import_react.useState)(null);
  const alive = (0, import_react.useRef)(true);
  const generation = (0, import_react.useRef)(0);
  const activeController = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const next = snapshot.value?.baseURL ?? DEFAULT_BASE_URL;
    if (!busy) setBaseURL(next);
  }, [busy, snapshot.value?.baseURL]);
  (0, import_react.useEffect)(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current += 1;
      activeController.current?.abort();
    };
  }, []);
  const refreshCredential = (0, import_react.useCallback)(() => setCredentialRevision((value) => value + 1), []);
  (0, import_react.useEffect)(() => subscribeCredentials(refreshCredential), [refreshCredential, subscribeCredentials]);
  (0, import_react.useEffect)(() => {
    let live = true;
    void ops.credentialConfigured().then((present) => {
      if (live) setConfigured(present);
    }).catch((reason) => {
      if (live) setError(errorMessage(reason));
    });
    return () => {
      live = false;
    };
  }, [ops, credentialRevision]);
  const beginOperation = (0, import_react.useCallback)(() => {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const token = ++generation.current;
    const active = () => alive.current && generation.current === token && !controller.signal.aborted;
    return { controller, active };
  }, []);
  const persistBaseURL = async (operation) => {
    const nextBaseURL = baseURL.trim() || DEFAULT_BASE_URL;
    await scope.set("baseURL", nextBaseURL);
    if (!operation.active()) throw new Error("\u64CD\u4F5C\u5DF2\u4E2D\u65AD\u3002");
    if (scope.getSnapshot().value?.baseURL !== nextBaseURL) {
      throw new Error("API \u5730\u5740\u672A\u80FD\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F\u540E\u91CD\u8BD5\u3002");
    }
  };
  const save = (0, import_react.useCallback)(async () => {
    const operation = beginOperation();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (apiKey.trim().length > 0) {
        await ops.storeCredential(apiKey.trim());
      }
      if (!operation.active()) return;
      await persistBaseURL(operation);
      setApiKey("");
      setConfigured(true);
      setSuccess("API Key \u5DF2\u4FDD\u5B58\u3002\u63D0\u4F9B\u65B9\u5DF2\u542F\u7528\uFF0C\u6A21\u578B\u5C06\u51FA\u73B0\u5728\u6A21\u578B\u9009\u62E9\u5668\u3002");
      refreshCredential();
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason));
    } finally {
      if (operation.active()) setBusy(false);
    }
  }, [apiKey, baseURL, beginOperation, ops, refreshCredential, scope]);
  const discover = (0, import_react.useCallback)(async () => {
    const operation = beginOperation();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (apiKey.trim().length > 0) {
        await ops.storeCredential(apiKey.trim());
        if (!operation.active()) return;
      }
      const discovered = await ops.discoverModels(baseURL.trim() || DEFAULT_BASE_URL);
      if (!operation.active()) return;
      const saved = new Map(models.map((model) => [model.id, model]));
      const rows = [];
      for (const row of discovered) {
        const protocol = protocolFor(row.id);
        if (protocol === void 0) continue;
        const existing = saved.get(row.id);
        rows.push(existing !== void 0 ? rowFromSaved({
          ...existing,
          ...typeof row.contextWindow === "number" && existing.contextWindow === void 0 ? { contextWindow: row.contextWindow } : {},
          ...typeof row.maxTokens === "number" && existing.maxTokens === void 0 ? { maxTokens: row.maxTokens } : {}
        }) : {
          ...referenceRow(row.id, protocol),
          ...typeof row.name === "string" && row.name.length > 0 ? { name: row.name } : {},
          ...typeof row.contextWindow === "number" ? { contextWindow: row.contextWindow } : {},
          ...typeof row.maxTokens === "number" ? { maxTokens: row.maxTokens } : {}
        });
      }
      setApiKey("");
      setConfigured(true);
      setPicker(rows);
      setSuccess(`\u53D1\u73B0 ${rows.length} \u4E2A Claude / Codex \u6A21\u578B\uFF0C\u52FE\u9009\u540E\u4FDD\u5B58\u6240\u9009\u3002`);
      refreshCredential();
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason));
    } finally {
      if (operation.active()) setBusy(false);
    }
  }, [apiKey, baseURL, beginOperation, models, ops, refreshCredential]);
  const saveSelection = (0, import_react.useCallback)(async () => {
    if (picker === null) return;
    const operation = beginOperation();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await persistBaseURL(operation);
      const nextModels = picker.filter((row) => row.checked).map(rowToSaved);
      await scope.set("models", nextModels);
      if (!operation.active()) throw new Error("\u64CD\u4F5C\u5DF2\u4E2D\u65AD\u3002");
      const savedModels = scope.getSnapshot().value?.models;
      if (!Array.isArray(savedModels) || savedModels.length !== nextModels.length || savedModels.some((model, index) => model.id !== nextModels[index]?.id)) {
        throw new Error("\u6A21\u578B\u5217\u8868\u672A\u80FD\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u3002");
      }
      setPicker(null);
      setSuccess(`\u5DF2\u4FDD\u5B58 ${nextModels.length} \u4E2A\u6A21\u578B\uFF0C\u542B\u5404\u81EA\u63A8\u7406\u53C2\u6570\u3002`);
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason));
    } finally {
      if (operation.active()) setBusy(false);
    }
  }, [baseURL, beginOperation, picker, scope]);
  const removeSaved = (0, import_react.useCallback)(async (id) => {
    const operation = beginOperation();
    setBusy(true);
    setError(null);
    try {
      const nextModels = models.filter((model) => model.id !== id);
      await scope.set("models", nextModels);
      if (!operation.active()) throw new Error("\u64CD\u4F5C\u5DF2\u4E2D\u65AD\u3002");
      setSuccess(`\u5DF2\u79FB\u9664 ${id}\u3002`);
    } catch (reason) {
      if (operation.active()) setError(errorMessage(reason));
    } finally {
      if (operation.active()) setBusy(false);
    }
  }, [beginOperation, models, scope]);
  const grouped = (0, import_react.useMemo)(() => ({
    claude: models.filter((model) => model.protocol === "claude-code").length,
    codex: models.filter((model) => model.protocol === "codex-responses").length
  }), [models]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh-any", "aria-label": "AnyRouter \u8BBE\u7F6E", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "AnyRouter" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u540C\u6B65 Claude\uFF08Agent SDK \u517C\u5BB9\u8BF7\u6C42\uFF09\u4E0E GPT/Codex\uFF08Responses\uFF09\u6A21\u578B\uFF0C\u5E76\u4E3A\u6BCF\u4E2A\u6A21\u578B\u4FDD\u5B58\u63A8\u7406\u53C2\u6570\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-any-status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-dot", "data-ready": configured }),
        configured ? "API Key \u5DF2\u914D\u7F6E\uFF08\u63D0\u4F9B\u65B9\u5DF2\u542F\u7528\uFF09" : "\u672A\u914D\u7F6E API Key\uFF08\u63D0\u4F9B\u65B9\u5DF2\u7981\u7528\uFF0C\u4E0D\u51FA\u73B0\u5728\u6A21\u578B\u9009\u62E9\u5668\uFF09"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: "dsh-any-key", children: "API Key\uFF08\u4EC5\u5199\u5165\uFF0C\u4E0D\u56DE\u663E\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            id: "dsh-any-key",
            type: "password",
            autoComplete: "off",
            placeholder: configured ? "\u8F93\u5165\u65B0 Key \u4EE5\u66FF\u6362" : "sk-\u2026",
            value: apiKey,
            disabled: busy || !writable,
            onChange: (event) => setApiKey(event.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: "dsh-any-url", children: "API \u5730\u5740" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            id: "dsh-any-url",
            type: "url",
            value: baseURL,
            disabled: busy || !writable,
            onChange: (event) => setBaseURL(event.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy || loading || !writable || apiKey.trim().length === 0 && !configured, onClick: save, children: "\u4FDD\u5B58\u914D\u7F6E" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "data-primary": "true", disabled: busy || loading || !writable || apiKey.trim().length === 0 && !configured, onClick: discover, children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u540C\u6B65\u6A21\u578B" })
      ] }),
      snapshot.status === "unavailable" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-any-error", role: "alert", children: "\u5F53\u524D\u8FDE\u63A5\u4E0D\u80FD\u4FEE\u6539\u8BBE\u7F6E\uFF0C\u8BF7\u5728\u672C\u673A Web \u9875\u9762\u64CD\u4F5C\u3002" }) : null,
      error === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-any-error", role: "alert", children: error }),
      success === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-any-success", role: "status", children: success })
    ] }),
    picker !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u9009\u62E9\u7EB3\u5165\u6A21\u578B\u9009\u62E9\u5668\u7684\u6A21\u578B" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u52FE\u9009\u6A21\u578B\u3001\u8C03\u6574\u63A8\u7406\u6863\u4F4D\u4E0E\u9ED8\u8BA4\u529B\u5EA6\uFF0C\u7136\u540E\u4FDD\u5B58\u6240\u9009\u3002gpt-5-codex \u9ED8\u8BA4\u4E0D\u52FE\u9009\uFF08Responses \u7AEF\u70B9\u4E0D\u652F\u6301\uFF09\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Picker, { rows: picker, onChange: setPicker }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => setPicker(picker.map((row) => ({ ...row, checked: true }))), children: "\u5168\u9009" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => setPicker(picker.map((row) => ({ ...row, checked: false }))), children: "\u5168\u4E0D\u9009" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "data-primary": "true", disabled: busy, onClick: saveSelection, children: "\u4FDD\u5B58\u6240\u9009" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => setPicker(null), children: "\u53D6\u6D88" })
      ] })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-any-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5DF2\u4FDD\u5B58\u6A21\u578B" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: models.length === 0 ? "\u5C1A\u672A\u4FDD\u5B58\u3002" : `Claude ${grouped.claude} \u4E2A\uFF0CCodex ${grouped.codex} \u4E2A\u3002` }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-any-models", children: models.map((model) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-any-model-name", title: model.id, children: model.name ?? model.id }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReasoningSummary, { model }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy || !writable, onClick: () => removeSaved(model.id), children: "\u79FB\u9664" })
      ] }, model.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-any-empty", children: "\u6A21\u578B\u5217\u8868\u662F\u5EFA\u8BAE\u6027\u7684\uFF1A\u4E0A\u6E38\u901A\u9053\u4E0D\u53EF\u7528\u6216\u6EE1\u8F7D\u65F6\uFF0C\u8BF7\u6C42\u4ECD\u53EF\u80FD\u5931\u8D25\uFF08429/500\uFF09\u3002" })
    ] })
  ] });
}
var inject = ["slots", "remote", "remote.credentials", "remote.llm", "settingsScope"];
var SUPPORTED_HOST = "@deepseek-ai/dsh-web-app 0.1.2-alpha.3 or later";
function createOperations(ctx) {
  const remote = ctx.remote;
  if (remote?.credentials?.describe === void 0 || remote?.llm?.discoverModels === void 0) {
    throw new Error(
      `dsh-anyrouter: this DSH build exposes no remote.credentials/remote.llm namespaces. Supported: ${SUPPORTED_HOST}. Upgrade DSH, or install a dsh-anyrouter release matching your Host.`
    );
  }
  return {
    credentialConfigured: async () => {
      const value = unwrapRemote(
        await remote.credentials.describe([API_KEY_REF])
      );
      return value?.[API_KEY_REF]?.configured === true;
    },
    storeCredential: async (value) => {
      unwrapRemote(await remote.credentials.set(API_KEY_REF, value));
    },
    discoverModels: async (baseURL) => {
      const value = unwrapRemote(await remote.llm.discoverModels(SETTINGS_NS, {
        provider: PROVIDER,
        baseURL
      }));
      const models = Array.isArray(value) ? value : value?.models;
      return Array.isArray(models) ? models : [];
    }
  };
}
function apply(ctx) {
  const ops = createOperations(ctx);
  const scope = ctx.get("settingsScope").bind({
    namespace: SETTINGS_NS,
    decode: (section) => typeof section === "object" && section !== null && !Array.isArray(section) ? section : void 0
  });
  const subscribeCredentials = (refresh) => {
    const disposers = [];
    try {
      disposers.push(ctx.remote.$on(
        "credentials/reference-updated",
        (ref) => {
          if (ref === API_KEY_REF) refresh();
        }
      ));
    } catch {
    }
    try {
      disposers.push(ctx.on("connection/reset", refresh));
    } catch {
    }
    return () => {
      for (const dispose of disposers) dispose();
    };
  };
  ctx.effect(() => {
    const element = document.createElement("style");
    element.dataset.plugin = "dsh-anyrouter";
    element.textContent = styles;
    document.head.appendChild(element);
    return () => element.remove();
  }, "dsh-anyrouter: settings styles");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: PROVIDER,
    order: 11,
    label: () => "AnyRouter",
    inject: () => ({ ops, scope, subscribeCredentials })
  }, Section));
}
return module.exports;}});
//# sourceMappingURL=client.js.map
