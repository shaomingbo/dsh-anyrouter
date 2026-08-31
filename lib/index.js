import { LlmError, ReasoningEffortId, RetryPolicySchema, assertUsableApiKey, attributionHeaders, normalizeApiKey, resolveRetryPolicy } from "@deepseek-ai/dsh-llm";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { deepEqualJson, installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import { createProvider } from "@earendil-works/pi-ai";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";
import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { MAX_TIMER_DELAY_MS } from "@deepseek-ai/dsh-timeout";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { stream } from "@earendil-works/pi-ai/api/anthropic-messages";
import { streamSimple } from "@earendil-works/pi-ai/api/openai-responses";
const MODEL_PROFILES_BY_ID = new Map([
	{
		id: "claude-3-5-haiku",
		protocol: "claude-code",
		name: "Claude Haiku 3.5 (latest)",
		efforts: [],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 8192,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-3-haiku",
		protocol: "claude-code",
		name: "Claude Haiku 3",
		efforts: [],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 4096,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-3-opus",
		protocol: "claude-code",
		name: "Claude Opus 3",
		efforts: [],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 4096,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-3-sonnet",
		protocol: "claude-code",
		name: "Claude Sonnet 3",
		efforts: [],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 4096,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-3.5-haiku",
		protocol: "claude-code",
		name: "Claude Haiku 3.5 (latest)",
		efforts: [],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 8192,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-3.5-sonnet",
		protocol: "claude-code",
		name: "Claude Sonnet 3.5 v2",
		efforts: [],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 8192,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-fable-5",
		protocol: "claude-code",
		name: "Claude Fable 5",
		efforts: [
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsStrictTools": true
		}
	},
	{
		id: "claude-haiku-4-5",
		protocol: "claude-code",
		name: "Claude Haiku 4.5 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 64e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-haiku-4-5-20251001",
		protocol: "claude-code",
		name: "Claude Haiku 4.5",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 64e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-haiku-4.5",
		protocol: "claude-code",
		name: "Claude Haiku 4.5 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 64e3,
		compat: { "supportsEagerToolInputStreaming": false }
	},
	{
		id: "claude-opus-4",
		protocol: "claude-code",
		name: "Claude Opus 4 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 32e3,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-opus-4-1",
		protocol: "claude-code",
		name: "Claude Opus 4.1 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 32e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-opus-4-1-20250805",
		protocol: "claude-code",
		name: "Claude Opus 4.1",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 32e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-opus-4-5",
		protocol: "claude-code",
		name: "Claude Opus 4.5 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 64e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-opus-4-5-20251101",
		protocol: "claude-code",
		name: "Claude Opus 4.5",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 64e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-opus-4-6",
		protocol: "claude-code",
		name: "Claude Opus 4.6",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsStrictTools": true
		}
	},
	{
		id: "claude-opus-4-7",
		protocol: "claude-code",
		name: "Claude Opus 4.7",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsTemperature": false,
			"supportsStrictTools": true
		}
	},
	{
		id: "claude-opus-4-8",
		protocol: "claude-code",
		name: "Claude Opus 4.8",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsTemperature": false,
			"supportsStrictTools": true
		}
	},
	{
		id: "claude-opus-4.5",
		protocol: "claude-code",
		name: "Claude Opus 4.5 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 32e3
	},
	{
		id: "claude-opus-4.6",
		protocol: "claude-code",
		name: "Claude Opus 4.6",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 32e3,
		compat: { "forceAdaptiveThinking": true }
	},
	{
		id: "claude-opus-4.7",
		protocol: "claude-code",
		name: "Claude Opus 4.7",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 32e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsTemperature": false
		}
	},
	{
		id: "claude-opus-4.8",
		protocol: "claude-code",
		name: "Claude Opus 4.8",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 64e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsTemperature": false
		}
	},
	{
		id: "claude-opus-5",
		protocol: "claude-code",
		name: "Claude Opus 5",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsTemperature": false,
			"supportsStrictTools": true
		}
	},
	{
		id: "claude-sonnet-4",
		protocol: "claude-code",
		name: "Claude Sonnet 4 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 64e3,
		compat: { "sendSessionAffinityHeaders": true }
	},
	{
		id: "claude-sonnet-4-5",
		protocol: "claude-code",
		name: "Claude Sonnet 4.5 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 1e6,
		maxTokens: 64e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-sonnet-4-5-20250929",
		protocol: "claude-code",
		name: "Claude Sonnet 4.5",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 1e6,
		maxTokens: 64e3,
		compat: { "supportsStrictTools": true }
	},
	{
		id: "claude-sonnet-4-6",
		protocol: "claude-code",
		name: "Claude Sonnet 4.6",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsStrictTools": true
		}
	},
	{
		id: "claude-sonnet-4.5",
		protocol: "claude-code",
		name: "Claude Sonnet 4.5 (latest)",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 2e5,
		maxTokens: 32e3,
		compat: { "supportsEagerToolInputStreaming": false }
	},
	{
		id: "claude-sonnet-4.6",
		protocol: "claude-code",
		name: "Claude Sonnet 4.6",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 32e3,
		compat: { "forceAdaptiveThinking": true }
	},
	{
		id: "claude-sonnet-5",
		protocol: "claude-code",
		name: "Claude Sonnet 5",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: true,
		contextWindow: 1e6,
		maxTokens: 128e3,
		compat: {
			"forceAdaptiveThinking": true,
			"supportsStrictTools": true
		}
	},
	{
		id: "gpt-4",
		protocol: "codex-responses",
		name: "GPT-4",
		efforts: [],
		adaptive: false,
		contextWindow: 8192,
		maxTokens: 8192,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4-turbo",
		protocol: "codex-responses",
		name: "GPT-4 Turbo",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 4096,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4.1",
		protocol: "codex-responses",
		name: "GPT-4.1",
		efforts: [],
		adaptive: false,
		contextWindow: 1047576,
		maxTokens: 32768,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4.1-mini",
		protocol: "codex-responses",
		name: "GPT-4.1 mini",
		efforts: [],
		adaptive: false,
		contextWindow: 1047576,
		maxTokens: 32768,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4.1-nano",
		protocol: "codex-responses",
		name: "GPT-4.1 nano",
		efforts: [],
		adaptive: false,
		contextWindow: 1047576,
		maxTokens: 32768,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4o",
		protocol: "codex-responses",
		name: "GPT-4o",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4o-2024-05-13",
		protocol: "codex-responses",
		name: "GPT-4o (2024-05-13)",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 4096,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4o-2024-08-06",
		protocol: "codex-responses",
		name: "GPT-4o (2024-08-06)",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4o-2024-11-20",
		protocol: "codex-responses",
		name: "GPT-4o (2024-11-20)",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-4o-mini",
		protocol: "codex-responses",
		name: "GPT-4o mini",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: { "supportsStrictMode": true }
	},
	{
		id: "gpt-5",
		protocol: "codex-responses",
		name: "GPT-5",
		efforts: [
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5-chat-latest",
		protocol: "codex-responses",
		name: "GPT-5 Chat Latest",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5-codex",
		protocol: "codex-responses",
		name: "GPT-5 Codex",
		efforts: [
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"sessionAffinityFormat": "openai-nosession",
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5-mini",
		protocol: "codex-responses",
		name: "GPT-5 Mini",
		efforts: [
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5-nano",
		protocol: "codex-responses",
		name: "GPT-5 Nano",
		efforts: [
			"minimal",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5-pro",
		protocol: "codex-responses",
		name: "GPT-5 Pro",
		efforts: ["high"],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.1",
		protocol: "codex-responses",
		name: "GPT-5.1",
		efforts: [
			"off",
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.1-codex",
		protocol: "codex-responses",
		name: "GPT-5.1 Codex",
		efforts: [
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: { "supportsOpenAIGrammarTools": true }
	},
	{
		id: "gpt-5.1-codex-max",
		protocol: "codex-responses",
		name: "GPT-5.1 Codex Max",
		efforts: [
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"sessionAffinityFormat": "openai-nosession",
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.1-codex-mini",
		protocol: "codex-responses",
		name: "GPT-5.1 Codex Mini",
		efforts: [
			"low",
			"medium",
			"high"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"sessionAffinityFormat": "openai-nosession",
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.2",
		protocol: "codex-responses",
		name: "GPT-5.2",
		efforts: [
			"off",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.2-chat-latest",
		protocol: "codex-responses",
		name: "GPT-5.2 Chat",
		efforts: ["medium", "xhigh"],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.2-codex",
		protocol: "codex-responses",
		name: "GPT-5.2 Codex",
		efforts: [
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: { "supportsOpenAIGrammarTools": true }
	},
	{
		id: "gpt-5.2-pro",
		protocol: "codex-responses",
		name: "GPT-5.2 Pro",
		efforts: [
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.3-chat-latest",
		protocol: "codex-responses",
		name: "GPT-5.3 Chat (latest)",
		efforts: [],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 16384,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.3-codex",
		protocol: "codex-responses",
		name: "GPT-5.3 Codex",
		efforts: [
			"off",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.3-codex-spark",
		protocol: "codex-responses",
		name: "GPT-5.3 Codex Spark",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 128e3,
		compat: { "supportsOpenAIGrammarTools": true }
	},
	{
		id: "gpt-5.4",
		protocol: "codex-responses",
		name: "GPT-5.4",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 272e3,
		maxTokens: 128e3,
		compat: {
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-5.4-mini",
		protocol: "codex-responses",
		name: "GPT-5.4 mini",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 272e3,
		maxTokens: 128e3,
		compat: {
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-5.4-nano",
		protocol: "codex-responses",
		name: "GPT-5.4 nano",
		efforts: [
			"off",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 4e5,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.4-pro",
		protocol: "codex-responses",
		name: "GPT-5.4 Pro",
		efforts: [
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 105e4,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-5.5",
		protocol: "codex-responses",
		name: "GPT-5.5",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 272e3,
		maxTokens: 128e3,
		compat: {
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-5.5-pro",
		protocol: "codex-responses",
		name: "GPT-5.5 Pro",
		efforts: [
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 105e4,
		maxTokens: 128e3,
		compat: {
			"supportsStrictMode": true,
			"supportsOpenAIGrammarTools": true
		}
	},
	{
		id: "gpt-5.6-luna",
		protocol: "codex-responses",
		name: "GPT-5.6 Luna",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: false,
		contextWindow: 272e3,
		maxTokens: 128e3,
		compat: {
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-5.6-sol",
		protocol: "codex-responses",
		name: "GPT-5.6 Sol",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: false,
		contextWindow: 272e3,
		maxTokens: 128e3,
		compat: {
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-5.6-terra",
		protocol: "codex-responses",
		name: "GPT-5.6 Terra",
		efforts: [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		],
		adaptive: false,
		contextWindow: 272e3,
		maxTokens: 128e3,
		compat: {
			"supportsOpenAIGrammarTools": true,
			"supportsToolSearch": true
		}
	},
	{
		id: "gpt-realtime-2.1",
		protocol: "codex-responses",
		name: "GPT-Realtime-2.1",
		efforts: [
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh"
		],
		adaptive: false,
		contextWindow: 128e3,
		maxTokens: 32e3,
		compat: { "supportsStrictMode": true }
	}
].map((profile) => [profile.id, profile]));
//#endregion
//#region src/config.ts
const PROVIDER = "anyrouter";
const SETTINGS_NS = "llm-anyrouter";
const DEFAULT_API_KEY_ENV = "ANYROUTER_API_KEY";
const DEFAULT_BASE_URL = "https://anyrouter.top";
const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5;
const REASONING_LEVELS = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
];
const ReasoningProfileSchema = z.object({
	disabled: z.boolean(),
	efforts: z.array(z.union([...REASONING_LEVELS])),
	defaultEffort: z.union([...REASONING_LEVELS]),
	adaptive: z.boolean()
});
const ModelSchema = z.object({
	id: z.string().required(),
	name: z.string(),
	protocol: z.union(["claude-code", "codex-responses"]).required(),
	contextWindow: z.number().step(1).min(1),
	maxTokens: z.number().step(1).min(1),
	reasoning: ReasoningProfileSchema
});
const Config = z.object({
	apiKeyEnv: z.string().role("credential-ref").default(DEFAULT_API_KEY_ENV),
	baseURL: z.string().default(DEFAULT_BASE_URL),
	models: z.array(ModelSchema).default([]),
	streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_STREAM_IDLE_TIMEOUT_MS),
	retryPolicy: RetryPolicySchema
});
function normalizeBaseURL(raw) {
	const value = (raw ?? "https://anyrouter.top").trim();
	let parsed;
	try {
		parsed = new URL(value);
	} catch (cause) {
		throw new Error(`dsh-anyrouter: invalid baseURL ${JSON.stringify(value)}`, { cause });
	}
	if (parsed.username.length > 0 || parsed.password.length > 0) throw new Error("dsh-anyrouter: baseURL must not contain user information");
	if (parsed.search.length > 0 || parsed.hash.length > 0) throw new Error("dsh-anyrouter: baseURL must not contain a query or fragment");
	const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
	if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) throw new Error("dsh-anyrouter: baseURL must use https (http is allowed only for loopback development)");
	parsed.pathname = parsed.pathname.replace(/\/+$/, "");
	return parsed.toString().replace(/\/+$/, "");
}
function resolveConfig(config) {
	if ((config.apiKeyEnv ?? "ANYROUTER_API_KEY") !== "ANYROUTER_API_KEY") throw new Error(`dsh-anyrouter: apiKeyEnv is fixed to ${DEFAULT_API_KEY_ENV}`);
	const streamIdleTimeoutMs = config.streamIdleTimeoutMs ?? 3e5;
	if (!Number.isFinite(streamIdleTimeoutMs) || streamIdleTimeoutMs <= 0 || streamIdleTimeoutMs > MAX_TIMER_DELAY_MS) throw new Error(`dsh-anyrouter: streamIdleTimeoutMs must be between 0 and ${MAX_TIMER_DELAY_MS}`);
	const models = config.models ?? [];
	const seen = /* @__PURE__ */ new Set();
	for (const model of models) {
		const id = model.id.trim();
		if (id.length === 0) throw new Error("dsh-anyrouter: model ids must be non-empty");
		if (seen.has(id)) throw new Error(`dsh-anyrouter: duplicate model id ${JSON.stringify(id)}`);
		seen.add(id);
		if (model.contextWindow !== void 0 && (!Number.isSafeInteger(model.contextWindow) || model.contextWindow <= 0)) throw new Error(`dsh-anyrouter: model ${JSON.stringify(id)} has invalid contextWindow`);
		if (model.maxTokens !== void 0 && (!Number.isSafeInteger(model.maxTokens) || model.maxTokens <= 0)) throw new Error(`dsh-anyrouter: model ${JSON.stringify(id)} has invalid maxTokens`);
		if (model.reasoning !== void 0) canonicalReasoningProfile(model.reasoning, model.protocol, id);
	}
	return {
		apiKeyEnv: credentialRef(DEFAULT_API_KEY_ENV),
		baseURL: normalizeBaseURL(config.baseURL),
		models: models.map((model) => ({
			...model,
			id: model.id.trim(),
			...model.reasoning === void 0 ? {} : { reasoning: canonicalReasoningProfile(model.reasoning, model.protocol, model.id.trim()) }
		})),
		streamIdleTimeoutMs,
		retryPolicy: resolveRetryPolicy(config.retryPolicy, "dsh-anyrouter: retryPolicy")
	};
}
function classifyProtocol(id) {
	const normalized = id.toLowerCase();
	if (normalized.startsWith("claude-")) return "claude-code";
	if (normalized.startsWith("gpt-")) return "codex-responses";
}
const LEVEL_SET = new Set(REASONING_LEVELS);
/**
* Validate and canonicalize one persisted reasoning profile: efforts are
* deduplicated into canonical order, `defaultEffort` must be selectable, and
* `adaptive` is a Claude-only statement (it switches the transport from a
* thinking budget to the adaptive `effort` field).
*/
function canonicalReasoningProfile(reasoning, protocol, id) {
	const label = `dsh-anyrouter: model ${JSON.stringify(id)} reasoning`;
	const selected = new Set((reasoning.efforts ?? []).filter((level) => LEVEL_SET.has(level)));
	const efforts = REASONING_LEVELS.filter((level) => selected.has(level));
	if (reasoning.defaultEffort !== void 0 && !efforts.includes(reasoning.defaultEffort)) throw new Error(`${label}.defaultEffort ${JSON.stringify(reasoning.defaultEffort)} must be one of its efforts`);
	if (reasoning.adaptive === true && protocol !== "claude-code") throw new Error(`${label}.adaptive is only valid for claude-code models`);
	if (reasoning.disabled === true) return { disabled: true };
	return {
		...efforts.length === 0 ? {} : { efforts },
		...reasoning.defaultEffort === void 0 ? {} : { defaultEffort: reasoning.defaultEffort },
		...reasoning.adaptive === void 0 ? {} : { adaptive: reasoning.adaptive }
	};
}
//#endregion
//#region src/catalog.ts
const FALLBACK_CONTEXT = {
	"claude-code": 1e6,
	"codex-responses": 4e5
};
const FALLBACK_MAX_TOKENS = {
	"claude-code": 128e3,
	"codex-responses": 128e3
};
/** Wire value each protocol family sends for a selectable level. */
const LEVEL_WIRE = {
	"claude-code": {
		off: "off",
		minimal: "low"
	},
	"codex-responses": {
		off: "none",
		minimal: "low"
	}
};
/**
* The reasoning profile one synchronized model runs with. A persisted profile
* (written by the settings section's picker) wins; anything it leaves empty
* falls back to the build-time reference profile from pi-ai's catalog, and a
* model neither knows falls back to the protocol default — the Claude
* fingerprint's adaptive efforts, or the Codex Responses set.
*/
function effectiveReasoning(config) {
	if (config.reasoning?.disabled === true) return {
		enabled: false,
		efforts: [],
		adaptive: false
	};
	const reference = MODEL_PROFILES_BY_ID.get(config.id);
	const referenceEfforts = (reference?.efforts ?? []).filter((level) => REASONING_LEVELS.includes(level));
	const persisted = config.reasoning;
	const efforts = persisted?.efforts !== void 0 && persisted.efforts.length > 0 ? persisted.efforts : referenceEfforts.length > 0 ? referenceEfforts : [...REASONING_LEVELS];
	const adaptive = persisted?.adaptive ?? reference?.adaptive ?? config.protocol === "claude-code";
	return {
		enabled: efforts.length > 0,
		efforts,
		...persisted?.defaultEffort === void 0 ? {} : { defaultEffort: persisted.defaultEffort },
		adaptive: adaptive && config.protocol === "claude-code"
	};
}
/**
* pi-ai's `getSupportedThinkingLevels` rules, inverted: every canonical level
* maps to its wire value when selectable and to `null` (explicitly absent)
* when not, so the level list offered by the model selector is exactly the
* persisted effort set.
*/
function thinkingLevelMapOf(protocol, efforts) {
	const selected = new Set(efforts);
	const map = {};
	for (const level of REASONING_LEVELS) map[level] = selected.has(level) ? LEVEL_WIRE[protocol][level] ?? level : null;
	return map;
}
function referenceProfile(id) {
	return MODEL_PROFILES_BY_ID.get(id);
}
function resolveModel(config, baseURL) {
	const reference = referenceProfile(config.id);
	const api = config.protocol === "claude-code" ? "anthropic-messages" : "openai-responses";
	const reasoning = effectiveReasoning(config);
	const compatSource = reference?.compat;
	const compat = config.protocol === "claude-code" && config.reasoning?.adaptive !== void 0 ? {
		...compatSource,
		forceAdaptiveThinking: reasoning.adaptive
	} : compatSource;
	const model = {
		id: config.id,
		name: config.name ?? reference?.name ?? config.id,
		api,
		provider: "anyrouter",
		baseUrl: config.protocol === "codex-responses" ? `${baseURL}/v1` : baseURL,
		reasoning: reasoning.enabled,
		input: ["text", "image"],
		cost: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0
		},
		contextWindow: config.contextWindow ?? reference?.contextWindow ?? FALLBACK_CONTEXT[config.protocol],
		maxTokens: config.maxTokens ?? reference?.maxTokens ?? FALLBACK_MAX_TOKENS[config.protocol]
	};
	if (reasoning.enabled) model.thinkingLevelMap = thinkingLevelMapOf(config.protocol, reasoning.efforts);
	if (compat !== void 0) model.compat = { ...compat };
	return model;
}
/**
* Advisory metadata for one discovered row: capacities and display name from
* the build-time reference profile, with protocol fallbacks for relay-only
* ids pi-ai has never heard of.
*/
function metadataForDiscoveredModel(id, protocol) {
	const reference = referenceProfile(id);
	if (reference === void 0) return {
		contextWindow: FALLBACK_CONTEXT[protocol],
		maxTokens: FALLBACK_MAX_TOKENS[protocol]
	};
	return {
		name: reference.name,
		contextWindow: reference.contextWindow,
		maxTokens: reference.maxTokens
	};
}
//#endregion
//#region src/transports/claude.ts
const CLAUDE_CODE_VERSION = "2.1.239";
const CLAUDE_CODE_BETAS = [
	"claude-code-20250219",
	"context-1m-2025-08-07",
	"interleaved-thinking-2025-05-14",
	"thinking-token-count-2026-05-13",
	"context-management-2025-06-27",
	"prompt-caching-scope-2026-01-05",
	"mid-conversation-system-2026-04-07",
	"effort-2025-11-24",
	"fallback-credit-2026-06-01"
];
const BILLING_IDENTITY = `x-anthropic-billing-header: cc_version=${CLAUDE_CODE_VERSION}.f32; cc_entrypoint=sdk-cli;`;
const AGENT_IDENTITY = "You are a Claude agent, built on Anthropic's Claude Agent SDK.";
const CLAUDE_TOOL_NAMES = {
	read: "Read",
	write: "Write",
	edit: "Edit",
	bash: "Bash",
	grep: "Grep",
	glob: "Glob",
	ask_user_question: "AskUserQuestion",
	enter_plan_mode: "EnterPlanMode",
	exit_plan_mode: "ExitPlanMode",
	kill_shell: "KillShell",
	notebook_edit: "NotebookEdit",
	task: "Task",
	task_output: "TaskOutput",
	skill: "Skill",
	todo_write: "TodoWrite",
	web_fetch: "WebFetch",
	web_search: "WebSearch"
};
function wireToolName(name) {
	return CLAUDE_TOOL_NAMES[name.toLowerCase()] ?? name;
}
function mappedContext(context) {
	const fromWire = /* @__PURE__ */ new Map();
	for (const tool of context.tools ?? []) fromWire.set(wireToolName(tool.name).toLowerCase(), tool.name);
	const remap = (name) => {
		const wire = wireToolName(name);
		if (!fromWire.has(wire.toLowerCase())) fromWire.set(wire.toLowerCase(), name);
		return wire;
	};
	const messages = context.messages.map((message) => {
		if (message.role === "assistant") return {
			...message,
			content: message.content.map((block) => block.type === "toolCall" ? {
				...block,
				name: remap(block.name)
			} : block)
		};
		if (message.role === "toolResult") return {
			...message,
			toolName: remap(message.toolName)
		};
		return message;
	});
	const tools = context.tools?.map((tool) => ({
		...tool,
		name: remap(tool.name)
	}));
	return {
		context: {
			...context,
			messages,
			...tools === void 0 ? {} : { tools }
		},
		fromWire
	};
}
function restoreName(value, fromWire) {
	if (typeof value !== "object" || value === null) return;
	const record = value;
	if (record.type === "toolCall" && typeof record.name === "string") record.name = fromWire.get(record.name.toLowerCase()) ?? record.name;
	for (const key of [
		"content",
		"partial",
		"message",
		"error",
		"toolCall"
	]) {
		const child = record[key];
		if (Array.isArray(child)) child.forEach((entry) => restoreName(entry, fromWire));
		else restoreName(child, fromWire);
	}
}
async function* restoredEvents$1(events, fromWire) {
	for await (const event of events) {
		restoreName(event, fromWire);
		yield event;
	}
}
function appendBetaQuery(input) {
	if (input instanceof Request) {
		const url = new URL(input.url);
		if (url.pathname.endsWith("/v1/messages")) url.searchParams.set("beta", "true");
		return new Request(url, input);
	}
	const url = new URL(input.toString());
	if (url.pathname.endsWith("/v1/messages")) url.searchParams.set("beta", "true");
	return typeof input === "string" ? url.toString() : url;
}
function createClient(model, apiKey, sessionId, headers) {
	const attribution = typeof headers?.["user-agent"] === "string" ? ` ${headers["user-agent"]}` : "";
	return new Anthropic({
		apiKey: null,
		authToken: apiKey,
		baseURL: model.baseUrl,
		maxRetries: 0,
		defaultHeaders: {
			...headers,
			accept: "application/json",
			"anthropic-beta": CLAUDE_CODE_BETAS.join(","),
			"anthropic-dangerous-direct-browser-access": "true",
			"user-agent": `claude-cli/${CLAUDE_CODE_VERSION} (external, sdk-cli)${attribution}`,
			"x-app": "cli",
			...sessionId === void 0 ? {} : { "x-claude-code-session-id": sessionId }
		},
		fetch: (input, init) => fetch(appendBetaQuery(input), init)
	});
}
const DEVICE_ID = randomBytes(32).toString("hex");
function sessionUuid(sessionId) {
	if (sessionId === void 0) return randomUUID();
	const value = createHash("sha256").update(sessionId).digest("hex").slice(0, 32);
	return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-8${value.slice(17, 20)}-${value.slice(20)}`;
}
function compatiblePayload$1(payload, sessionId) {
	if (typeof payload !== "object" || payload === null) return payload;
	const source = payload;
	const currentSystem = Array.isArray(source.system) ? source.system : [];
	const systemText = new Set(currentSystem.flatMap((block) => typeof block === "object" && block !== null && typeof block.text === "string" ? [block.text] : []));
	const system = [...[{
		type: "text",
		text: BILLING_IDENTITY
	}, {
		type: "text",
		text: AGENT_IDENTITY,
		cache_control: { type: "ephemeral" }
	}].filter((block) => !systemText.has(block.text)), ...currentSystem.map((block) => typeof block === "object" && block !== null ? {
		...block,
		cache_control: { type: "ephemeral" }
	} : block)];
	const messages = Array.isArray(source.messages) ? source.messages.map((message, index, all) => {
		if (index !== all.length - 1 || typeof message !== "object" || message === null) return message;
		const content = message.content;
		if (!Array.isArray(content) || content.length === 0) return message;
		return {
			...message,
			content: content.map((block, blockIndex) => blockIndex === content.length - 1 && typeof block === "object" && block !== null && block.type === "text" ? {
				...block,
				cache_control: { type: "ephemeral" }
			} : block)
		};
	}) : source.messages;
	const sourceTools = Array.isArray(source.tools) ? source.tools : void 0;
	const tools = sourceTools !== void 0 && sourceTools.length > 0 ? sourceTools.map((tool, index) => index === sourceTools.length - 1 && typeof tool === "object" && tool !== null ? {
		...tool,
		cache_control: { type: "ephemeral" }
	} : tool) : source.tools;
	return {
		...source,
		system,
		messages,
		tools,
		metadata: {
			...typeof source.metadata === "object" && source.metadata !== null ? source.metadata : {},
			user_id: JSON.stringify({
				device_id: DEVICE_ID,
				account_uuid: "",
				session_id: sessionUuid(sessionId)
			})
		},
		context_management: { edits: [{
			type: "clear_thinking_20251015",
			keep: "all"
		}] }
	};
}
function effortOf(level) {
	if (level === "minimal" || level === "low") return "low";
	return level;
}
function budgetOf(level) {
	switch (level) {
		case "minimal": return 1024;
		case "low": return 2048;
		case "medium": return 8192;
		case "high":
		case "xhigh":
		case "max": return 16384;
	}
}
function runClaude(model, context, options) {
	const apiKey = options?.apiKey;
	if (apiKey === void 0 || apiKey.trim().length === 0) throw new Error("No API key for provider: anyrouter");
	const mapped = mappedContext(context);
	const reasoning = options?.reasoning;
	const anthropicModel = model;
	const adaptive = anthropicModel.compat?.forceAdaptiveThinking === true;
	const { apiKey: _apiKey, reasoning: _reasoning, headers, ...baseOptions } = options ?? {};
	const requestedMaxTokens = baseOptions.maxTokens ?? anthropicModel.maxTokens;
	const thinkingBudget = reasoning === void 0 || adaptive ? void 0 : Math.min(budgetOf(reasoning), Math.max(0, requestedMaxTokens - 1024));
	const thinkingEnabled = reasoning !== void 0 && (adaptive || (thinkingBudget ?? 0) >= 1024);
	const anthropicOptions = {
		...baseOptions,
		client: createClient(model, apiKey, options?.sessionId, headers),
		thinkingDisplay: "omitted",
		maxRetries: 0,
		thinkingEnabled,
		...reasoning === void 0 || !thinkingEnabled ? {} : adaptive ? { effort: effortOf(reasoning) } : { thinkingBudgetTokens: thinkingBudget },
		onPayload: async (payload, payloadModel) => {
			const compatible = compatiblePayload$1(payload, options?.sessionId);
			return options?.onPayload === void 0 ? compatible : await options.onPayload(compatible, payloadModel) ?? compatible;
		}
	};
	return restoredEvents$1(stream(anthropicModel, mapped.context, anthropicOptions), mapped.fromWire);
}
const claudeCodeStreams = {
	stream(model, context, options) {
		return runClaude(model, context, options);
	},
	streamSimple(model, context, options) {
		return runClaude(model, context, options);
	}
};
//#endregion
//#region src/transports/codex.ts
const CODEX_VERSION = "0.114.0";
function compatiblePayload(payload, systemPrompt) {
	if (typeof payload !== "object" || payload === null) return payload;
	const source = payload;
	const input = Array.isArray(source.input) ? source.input : [];
	const filtered = systemPrompt === void 0 ? input : input.filter((item) => !(typeof item === "object" && item !== null && (item.role === "developer" || item.role === "system") && item.content === systemPrompt));
	return {
		...source,
		instructions: systemPrompt ?? source.instructions ?? "You are a coding agent.",
		input: filtered,
		store: false,
		stream: true,
		tool_choice: source.tool_choice ?? "auto",
		parallel_tool_calls: source.parallel_tool_calls ?? true,
		text: source.text ?? { verbosity: "low" },
		include: Array.isArray(source.include) ? [.../* @__PURE__ */ new Set([...source.include, "reasoning.encrypted_content"])] : ["reasoning.encrypted_content"]
	};
}
function nativeContext(context) {
	return {
		...context,
		messages: context.messages.map((message) => message.role === "assistant" ? {
			...message,
			provider: "openai-codex"
		} : message)
	};
}
function restoreProvider(value) {
	if (typeof value !== "object" || value === null) return;
	const record = value;
	if (record.provider === "openai-codex") record.provider = "anyrouter";
	for (const key of [
		"content",
		"partial",
		"message",
		"error"
	]) {
		const child = record[key];
		if (Array.isArray(child)) child.forEach(restoreProvider);
		else restoreProvider(child);
	}
}
async function* restoredEvents(events) {
	for await (const event of events) {
		restoreProvider(event);
		yield event;
	}
}
function runCodex(model, context, options) {
	const attribution = typeof options?.headers?.["user-agent"] === "string" ? ` ${options.headers["user-agent"]}` : "";
	const headers = {
		...options?.headers,
		accept: "text/event-stream",
		"openai-beta": "responses=experimental",
		"user-agent": `codex_cli_rs/${CODEX_VERSION}${attribution}`,
		originator: "codex_cli_rs"
	};
	const nativeModel = {
		...model,
		provider: "openai-codex"
	};
	return restoredEvents(streamSimple(nativeModel, nativeContext(context), {
		...options,
		transport: "sse",
		headers,
		maxRetries: 0,
		onPayload: async (payload) => {
			const compatible = compatiblePayload(payload, context.systemPrompt);
			return options?.onPayload === void 0 ? compatible : await options.onPayload(compatible, model) ?? compatible;
		}
	}));
}
const codexResponsesStreams = {
	stream(model, context, options) {
		return runCodex(model, context, options);
	},
	streamSimple(model, context, options) {
		return runCodex(model, context, options);
	}
};
//#endregion
//#region src/adapter.ts
const ambientAuth = { apiKey: {
	name: "AnyRouter API key",
	resolve: ({ credential }) => Promise.resolve(credential?.key === void 0 ? void 0 : {
		auth: { apiKey: credential.key },
		source: "DSH credential seam"
	})
} };
function providerOf(config) {
	const models = config.models.map((model) => resolveModel(model, config.baseURL));
	return createProvider({
		id: "anyrouter",
		name: "AnyRouter",
		baseUrl: config.baseURL,
		auth: ambientAuth,
		models,
		api: {
			"anthropic-messages": claudeCodeStreams,
			"openai-responses": codexResponsesStreams
		}
	});
}
function profileOf(config) {
	return {
		provider: "anyrouter",
		displayName: "AnyRouter",
		apiKeyEnv: config.apiKeyEnv,
		baseURL: config.baseURL,
		streamIdleTimeoutMs: config.streamIdleTimeoutMs,
		maxRequestImageBytes: 33554432,
		requestImagePixelBudget: 1e8,
		requestImageMaxBytes: 33554432,
		retryPolicy: config.retryPolicy,
		piProvider: providerOf(config),
		configuredMaxTokens: /* @__PURE__ */ new Map(),
		transport: "sse"
	};
}
var AnyRouterAdapter = class extends PiAiAdapter {
	constructor(options) {
		let snapshotConfig;
		let snapshotProfiles;
		const profiles = () => {
			const config = options.config();
			if (config === snapshotConfig && snapshotProfiles !== void 0) return snapshotProfiles;
			snapshotConfig = config;
			snapshotProfiles = /* @__PURE__ */ new Map([["anyrouter", profileOf(config)]]);
			return snapshotProfiles;
		};
		super({
			profiles,
			resolveApiKey: async (_provider, profile) => {
				if (profile.apiKeyEnv === void 0) throw new Error("dsh-anyrouter: resolved profile lost its credential ref");
				return options.resolveApiKey(profile.apiKeyEnv);
			},
			auth: {
				credentials: {
					read: () => Promise.resolve(void 0),
					list: () => Promise.resolve([]),
					modify: (_providerId, update) => update(void 0),
					delete: () => Promise.resolve()
				},
				authContext: {
					env: (name) => Promise.resolve(process.env[name]),
					fileExists: () => Promise.resolve(false)
				}
			},
			resolveAttachments: options.resolveAttachments ?? (() => void 0)
		});
		this.modelOptions = options;
	}
	modelOptions;
	/**
	* Surface the per-model default effort the persisted reasoning profile
	* carries. The generic adapter can only mark a profile-wide default, which
	* for a multi-model route like this one would be wrong for every model but
	* one; patching the resolved info keeps the selector's marked default equal
	* to what the settings section saved.
	*/
	async resolveModel(provider, model, signal) {
		const info = await super.resolveModel(provider, model, signal);
		if (info.reasoning === void 0) return info;
		const row = this.modelOptions.config().models.find((candidate) => candidate.id === model);
		const defaultEffort = row === void 0 ? void 0 : effectiveReasoning(row).defaultEffort;
		if (row === void 0 || defaultEffort === void 0) return info;
		return {
			...info,
			reasoning: {
				...info.reasoning,
				defaultEffort: ReasoningEffortId(defaultEffort)
			}
		};
	}
};
//#endregion
//#region src/discovery.ts
const MAX_RESPONSE_BYTES = 4194304;
function positiveInteger(...values) {
	return values.find((value) => typeof value === "number" && Number.isSafeInteger(value) && value > 0);
}
function nonEmptyString(...values) {
	return values.find((value) => typeof value === "string" && value.length > 0);
}
function modelURL(baseURL) {
	const url = new URL(baseURL);
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/v1/models`;
	url.search = "";
	url.hash = "";
	return url.toString();
}
async function readBounded(response, signal) {
	if (response.body === null) return "";
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let bytes = 0;
	let text = "";
	try {
		while (true) {
			if (signal?.aborted) throw signal.reason;
			const next = await reader.read();
			if (next.done) break;
			bytes += next.value.byteLength;
			if (bytes > MAX_RESPONSE_BYTES) throw new LlmError(`AnyRouter model listing exceeds ${MAX_RESPONSE_BYTES} bytes`, "DISCOVERY_FAILED");
			text += decoder.decode(next.value, { stream: true });
		}
		text += decoder.decode();
		return text;
	} finally {
		await reader.cancel().catch(() => void 0);
	}
}
function rowsOf(body) {
	if (typeof body !== "object" || body === null || !Array.isArray(body.data)) throw new LlmError("AnyRouter model listing is not an OpenAI-compatible data array", "DISCOVERY_FAILED");
	return body.data.filter((row) => typeof row === "object" && row !== null);
}
async function discoverAnyRouterModels(options) {
	const keyCheck = normalizeApiKey(options.apiKey);
	if (!keyCheck.ok) throw new LlmError(`AnyRouter model discovery received an unusable API key (${keyCheck.reason})`, "INVALID_CREDENTIAL");
	const key = keyCheck.value;
	const url = modelURL(normalizeBaseURL(options.baseURL));
	let response;
	try {
		response = await (options.fetch ?? fetch)(url, {
			headers: {
				...attributionHeaders(),
				accept: "application/json",
				authorization: `Bearer ${key}`
			},
			...options.signal === void 0 ? {} : { signal: options.signal }
		});
	} catch (cause) {
		if (options.signal?.aborted) throw new LlmError("AnyRouter model discovery aborted", "ABORTED", { cause });
		throw new LlmError(`failed to fetch AnyRouter models from ${url}`, "DISCOVERY_FAILED", { cause });
	}
	if (!response.ok) throw new LlmError(`${url} answered ${response.status}${response.status === 401 || response.status === 403 ? "; check the API key" : ""}`, response.status === 401 || response.status === 403 ? "INVALID_CREDENTIAL" : "DISCOVERY_FAILED");
	let text;
	try {
		text = await readBounded(response, options.signal);
	} catch (cause) {
		if (options.signal?.aborted) throw new LlmError("AnyRouter model discovery aborted", "ABORTED", { cause });
		throw new LlmError(`failed to read AnyRouter models from ${url}`, "DISCOVERY_FAILED", { cause });
	}
	let body;
	try {
		body = JSON.parse(text);
	} catch (cause) {
		throw new LlmError(`${url} did not answer with JSON`, "DISCOVERY_FAILED", { cause });
	}
	const discovered = [];
	const seen = /* @__PURE__ */ new Set();
	for (const row of rowsOf(body)) {
		if (typeof row.id !== "string" || row.id.length === 0 || seen.has(row.id)) continue;
		const protocol = classifyProtocol(row.id);
		if (protocol === void 0) continue;
		seen.add(row.id);
		const fallback = metadataForDiscoveredModel(row.id, protocol);
		const name = nonEmptyString(row.name, row.display_name, fallback.name);
		const contextWindow = positiveInteger(row.context_window, row.context_length, fallback.contextWindow);
		const maxTokens = positiveInteger(row.max_tokens, row.max_output_tokens, fallback.maxTokens);
		discovered.push({
			id: row.id,
			...name === void 0 ? {} : { name },
			...contextWindow === void 0 ? {} : { contextWindow },
			...maxTokens === void 0 ? {} : { maxTokens }
		});
	}
	return discovered;
}
//#endregion
//#region src/index.ts
const name = "dsh-anyrouter";
const inject = ["llm"];
function apply(ctx, config) {
	let current = () => config;
	let lastRaw;
	let lastGood;
	const options = () => {
		const raw = current();
		if (raw === lastRaw && lastGood !== void 0) return lastGood;
		try {
			const next = resolveConfig(raw);
			lastRaw = raw;
			lastGood = next;
			return next;
		} catch (error) {
			if (lastGood === void 0) throw error;
			lastRaw = raw;
			ctx.logger.error("dsh-anyrouter: keeping the last good configuration after an invalid settings update");
			ctx.logger.error(error);
			return lastGood;
		}
	};
	options();
	const resolveApiKey = async (ref) => {
		const credentials = ctx.get("credentials");
		if (credentials !== void 0) {
			const hit = await credentials.resolve(ref);
			if (hit !== void 0) return assertUsableApiKey(hit.value, "dsh-anyrouter", ref);
		} else {
			const ambient = launchEnvironmentOf(ctx).get(ref);
			if (ambient !== void 0 && ambient.value.length > 0) return assertUsableApiKey(ambient.value, "dsh-anyrouter", ref);
		}
		throw new LlmError(`dsh-anyrouter: no API key; store ${ref} in the credentials service or export it before launching DSH`, "MISSING_CREDENTIAL");
	};
	const adapter = new AnyRouterAdapter({
		config: options,
		resolveApiKey,
		resolveAttachments: () => ctx.get("attachments")
	});
	ctx.llm.registerConfigurableProviders([{
		provider: PROVIDER,
		displayName: "AnyRouter",
		settingsNs: SETTINGS_NS,
		settingsPath: []
	}]);
	const keyPresent = async () => {
		const credentials = ctx.get("credentials");
		if (credentials !== void 0) {
			const hit = await credentials.resolve(options().apiKeyEnv);
			return hit !== void 0 && hit.value.length > 0;
		}
		const ambient = launchEnvironmentOf(ctx).get(options().apiKeyEnv);
		return ambient !== void 0 && ambient.value.length > 0;
	};
	let registration;
	let registeredPolicy;
	let evaluating = false;
	let dirty = false;
	let disposed = false;
	const ensureRoute = async () => {
		if (disposed) return;
		if (evaluating) {
			dirty = true;
			return;
		}
		evaluating = true;
		try {
			let present;
			try {
				present = await keyPresent();
			} catch (error) {
				ctx.logger.error("dsh-anyrouter: credential presence check failed; keeping the current route state");
				ctx.logger.error(error);
				return;
			}
			if (disposed) return;
			if (!present) {
				if (registration !== void 0) {
					registration();
					registration = void 0;
					registeredPolicy = void 0;
				}
				return;
			}
			const policy = options().retryPolicy;
			if (registration === void 0) {
				registration = ctx.llm.registerAdapter([PROVIDER], adapter);
				registeredPolicy = policy;
				return;
			}
			if (registeredPolicy === void 0 || !deepEqualJson(policy, registeredPolicy)) {
				registration.replace([PROVIDER]);
				registeredPolicy = policy;
			}
		} finally {
			evaluating = false;
			if (dirty && !disposed) {
				dirty = false;
				ensureRoute();
			}
		}
	};
	ctx.effect(() => () => {
		disposed = true;
	}, "dsh-anyrouter: route activation lifecycle");
	ensureRoute();
	const scheduleRouteCheck = () => {
		ensureRoute();
	};
	ctx.on("credentials/reference-updated", (ref) => {
		if (ref === options().apiKeyEnv) scheduleRouteCheck();
	});
	ctx.llm.registerModelDiscovery(settingsNamespace(SETTINGS_NS), async (request) => {
		const resolved = options();
		const apiKey = request.apiKey ?? await resolveApiKey(resolved.apiKeyEnv);
		return discoverAnyRouterModels({
			baseURL: request.baseURL?.trim() || resolved.baseURL,
			apiKey,
			...request.signal === void 0 ? {} : { signal: request.signal }
		});
	});
	installSettingsSection(ctx, settingsNamespace(SETTINGS_NS), Config, config, {
		setSource: (source) => {
			current = source;
		},
		onChange: scheduleRouteCheck,
		validate: (value) => {
			resolveConfig(value);
		}
	});
}
//#endregion
export { AnyRouterAdapter, Config, apply, claudeCodeStreams, codexResponsesStreams, discoverAnyRouterModels, inject, name, resolveConfig };

//# sourceMappingURL=index.js.map