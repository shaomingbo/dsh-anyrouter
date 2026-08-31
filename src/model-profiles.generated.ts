// GENERATED FILE — do not edit by hand.
// Source: scripts/generate-model-profiles.mjs over @earendil-works/pi-ai's
// builtin catalog. Regenerate after a pi-ai version bump and commit the diff;
// tests fail when a referenced profile is missing at runtime.

export type AnyRouterProtocolFamily = 'claude-code' | 'codex-responses'

export interface GeneratedModelProfile {
  readonly id: string
  readonly protocol: AnyRouterProtocolFamily
  readonly name: string
  /** Empty means the reference model is non-reasoning. */
  readonly efforts: readonly string[]
  readonly adaptive: boolean
  readonly contextWindow: number
  readonly maxTokens: number
  readonly compat?: Readonly<Record<string, unknown>>
}

export const MODEL_PROFILES: readonly GeneratedModelProfile[] = [
  {id:"claude-3-5-haiku",protocol:"claude-code",name:"Claude Haiku 3.5 (latest)",efforts:[],adaptive:false,contextWindow:200000,maxTokens:8192,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-3-haiku",protocol:"claude-code",name:"Claude Haiku 3",efforts:[],adaptive:false,contextWindow:200000,maxTokens:4096,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-3-opus",protocol:"claude-code",name:"Claude Opus 3",efforts:[],adaptive:false,contextWindow:200000,maxTokens:4096,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-3-sonnet",protocol:"claude-code",name:"Claude Sonnet 3",efforts:[],adaptive:false,contextWindow:200000,maxTokens:4096,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-3.5-haiku",protocol:"claude-code",name:"Claude Haiku 3.5 (latest)",efforts:[],adaptive:false,contextWindow:200000,maxTokens:8192,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-3.5-sonnet",protocol:"claude-code",name:"Claude Sonnet 3.5 v2",efforts:[],adaptive:false,contextWindow:200000,maxTokens:8192,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-fable-5",protocol:"claude-code",name:"Claude Fable 5",efforts:["minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsStrictTools":true}},
  {id:"claude-haiku-4-5",protocol:"claude-code",name:"Claude Haiku 4.5 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:64000,compat:{"supportsStrictTools":true}},
  {id:"claude-haiku-4-5-20251001",protocol:"claude-code",name:"Claude Haiku 4.5",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:64000,compat:{"supportsStrictTools":true}},
  {id:"claude-haiku-4.5",protocol:"claude-code",name:"Claude Haiku 4.5 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:64000,compat:{"supportsEagerToolInputStreaming":false}},
  {id:"claude-opus-4",protocol:"claude-code",name:"Claude Opus 4 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:32000,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-opus-4-1",protocol:"claude-code",name:"Claude Opus 4.1 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:32000,compat:{"supportsStrictTools":true}},
  {id:"claude-opus-4-1-20250805",protocol:"claude-code",name:"Claude Opus 4.1",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:32000,compat:{"supportsStrictTools":true}},
  {id:"claude-opus-4-5",protocol:"claude-code",name:"Claude Opus 4.5 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:64000,compat:{"supportsStrictTools":true}},
  {id:"claude-opus-4-5-20251101",protocol:"claude-code",name:"Claude Opus 4.5",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:64000,compat:{"supportsStrictTools":true}},
  {id:"claude-opus-4-6",protocol:"claude-code",name:"Claude Opus 4.6",efforts:["off","minimal","low","medium","high","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsStrictTools":true}},
  {id:"claude-opus-4-7",protocol:"claude-code",name:"Claude Opus 4.7",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsTemperature":false,"supportsStrictTools":true}},
  {id:"claude-opus-4-8",protocol:"claude-code",name:"Claude Opus 4.8",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsTemperature":false,"supportsStrictTools":true}},
  {id:"claude-opus-4.5",protocol:"claude-code",name:"Claude Opus 4.5 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:32000},
  {id:"claude-opus-4.6",protocol:"claude-code",name:"Claude Opus 4.6",efforts:["off","minimal","low","medium","high","max"],adaptive:true,contextWindow:1000000,maxTokens:32000,compat:{"forceAdaptiveThinking":true}},
  {id:"claude-opus-4.7",protocol:"claude-code",name:"Claude Opus 4.7",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:32000,compat:{"forceAdaptiveThinking":true,"supportsTemperature":false}},
  {id:"claude-opus-4.8",protocol:"claude-code",name:"Claude Opus 4.8",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:64000,compat:{"forceAdaptiveThinking":true,"supportsTemperature":false}},
  {id:"claude-opus-5",protocol:"claude-code",name:"Claude Opus 5",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsTemperature":false,"supportsStrictTools":true}},
  {id:"claude-sonnet-4",protocol:"claude-code",name:"Claude Sonnet 4 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:64000,compat:{"sendSessionAffinityHeaders":true}},
  {id:"claude-sonnet-4-5",protocol:"claude-code",name:"Claude Sonnet 4.5 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:1000000,maxTokens:64000,compat:{"supportsStrictTools":true}},
  {id:"claude-sonnet-4-5-20250929",protocol:"claude-code",name:"Claude Sonnet 4.5",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:1000000,maxTokens:64000,compat:{"supportsStrictTools":true}},
  {id:"claude-sonnet-4-6",protocol:"claude-code",name:"Claude Sonnet 4.6",efforts:["off","minimal","low","medium","high","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsStrictTools":true}},
  {id:"claude-sonnet-4.5",protocol:"claude-code",name:"Claude Sonnet 4.5 (latest)",efforts:["off","minimal","low","medium","high"],adaptive:false,contextWindow:200000,maxTokens:32000,compat:{"supportsEagerToolInputStreaming":false}},
  {id:"claude-sonnet-4.6",protocol:"claude-code",name:"Claude Sonnet 4.6",efforts:["off","minimal","low","medium","high","max"],adaptive:true,contextWindow:1000000,maxTokens:32000,compat:{"forceAdaptiveThinking":true}},
  {id:"claude-sonnet-5",protocol:"claude-code",name:"Claude Sonnet 5",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:true,contextWindow:1000000,maxTokens:128000,compat:{"forceAdaptiveThinking":true,"supportsStrictTools":true}},
  {id:"gpt-4",protocol:"codex-responses",name:"GPT-4",efforts:[],adaptive:false,contextWindow:8192,maxTokens:8192,compat:{"supportsStrictMode":true}},
  {id:"gpt-4-turbo",protocol:"codex-responses",name:"GPT-4 Turbo",efforts:[],adaptive:false,contextWindow:128000,maxTokens:4096,compat:{"supportsStrictMode":true}},
  {id:"gpt-4.1",protocol:"codex-responses",name:"GPT-4.1",efforts:[],adaptive:false,contextWindow:1047576,maxTokens:32768,compat:{"supportsStrictMode":true}},
  {id:"gpt-4.1-mini",protocol:"codex-responses",name:"GPT-4.1 mini",efforts:[],adaptive:false,contextWindow:1047576,maxTokens:32768,compat:{"supportsStrictMode":true}},
  {id:"gpt-4.1-nano",protocol:"codex-responses",name:"GPT-4.1 nano",efforts:[],adaptive:false,contextWindow:1047576,maxTokens:32768,compat:{"supportsStrictMode":true}},
  {id:"gpt-4o",protocol:"codex-responses",name:"GPT-4o",efforts:[],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true}},
  {id:"gpt-4o-2024-05-13",protocol:"codex-responses",name:"GPT-4o (2024-05-13)",efforts:[],adaptive:false,contextWindow:128000,maxTokens:4096,compat:{"supportsStrictMode":true}},
  {id:"gpt-4o-2024-08-06",protocol:"codex-responses",name:"GPT-4o (2024-08-06)",efforts:[],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true}},
  {id:"gpt-4o-2024-11-20",protocol:"codex-responses",name:"GPT-4o (2024-11-20)",efforts:[],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true}},
  {id:"gpt-4o-mini",protocol:"codex-responses",name:"GPT-4o mini",efforts:[],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true}},
  {id:"gpt-5",protocol:"codex-responses",name:"GPT-5",efforts:["minimal","low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5-chat-latest",protocol:"codex-responses",name:"GPT-5 Chat Latest",efforts:[],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5-codex",protocol:"codex-responses",name:"GPT-5 Codex",efforts:["low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"sessionAffinityFormat":"openai-nosession","supportsOpenAIGrammarTools":true}},
  {id:"gpt-5-mini",protocol:"codex-responses",name:"GPT-5 Mini",efforts:["minimal","low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5-nano",protocol:"codex-responses",name:"GPT-5 Nano",efforts:["minimal","low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5-pro",protocol:"codex-responses",name:"GPT-5 Pro",efforts:["high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.1",protocol:"codex-responses",name:"GPT-5.1",efforts:["off","low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.1-codex",protocol:"codex-responses",name:"GPT-5.1 Codex",efforts:["low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.1-codex-max",protocol:"codex-responses",name:"GPT-5.1 Codex Max",efforts:["low","medium","high","xhigh"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"sessionAffinityFormat":"openai-nosession","supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.1-codex-mini",protocol:"codex-responses",name:"GPT-5.1 Codex Mini",efforts:["low","medium","high"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"sessionAffinityFormat":"openai-nosession","supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.2",protocol:"codex-responses",name:"GPT-5.2",efforts:["off","low","medium","high","xhigh"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.2-chat-latest",protocol:"codex-responses",name:"GPT-5.2 Chat",efforts:["medium","xhigh"],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.2-codex",protocol:"codex-responses",name:"GPT-5.2 Codex",efforts:["low","medium","high","xhigh"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.2-pro",protocol:"codex-responses",name:"GPT-5.2 Pro",efforts:["medium","high","xhigh"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.3-chat-latest",protocol:"codex-responses",name:"GPT-5.3 Chat (latest)",efforts:[],adaptive:false,contextWindow:128000,maxTokens:16384,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.3-codex",protocol:"codex-responses",name:"GPT-5.3 Codex",efforts:["off","low","medium","high","xhigh"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.3-codex-spark",protocol:"codex-responses",name:"GPT-5.3 Codex Spark",efforts:["off","minimal","low","medium","high","xhigh"],adaptive:false,contextWindow:128000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.4",protocol:"codex-responses",name:"GPT-5.4",efforts:["off","minimal","low","medium","high","xhigh"],adaptive:false,contextWindow:272000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-5.4-mini",protocol:"codex-responses",name:"GPT-5.4 mini",efforts:["off","minimal","low","medium","high","xhigh"],adaptive:false,contextWindow:272000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-5.4-nano",protocol:"codex-responses",name:"GPT-5.4 nano",efforts:["off","low","medium","high","xhigh"],adaptive:false,contextWindow:400000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.4-pro",protocol:"codex-responses",name:"GPT-5.4 Pro",efforts:["medium","high","xhigh"],adaptive:false,contextWindow:1050000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-5.5",protocol:"codex-responses",name:"GPT-5.5",efforts:["off","minimal","low","medium","high","xhigh"],adaptive:false,contextWindow:272000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-5.5-pro",protocol:"codex-responses",name:"GPT-5.5 Pro",efforts:["medium","high","xhigh"],adaptive:false,contextWindow:1050000,maxTokens:128000,compat:{"supportsStrictMode":true,"supportsOpenAIGrammarTools":true}},
  {id:"gpt-5.6-luna",protocol:"codex-responses",name:"GPT-5.6 Luna",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:false,contextWindow:272000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-5.6-sol",protocol:"codex-responses",name:"GPT-5.6 Sol",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:false,contextWindow:272000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-5.6-terra",protocol:"codex-responses",name:"GPT-5.6 Terra",efforts:["off","minimal","low","medium","high","xhigh","max"],adaptive:false,contextWindow:272000,maxTokens:128000,compat:{"supportsOpenAIGrammarTools":true,"supportsToolSearch":true}},
  {id:"gpt-realtime-2.1",protocol:"codex-responses",name:"GPT-Realtime-2.1",efforts:["minimal","low","medium","high","xhigh"],adaptive:false,contextWindow:128000,maxTokens:32000,compat:{"supportsStrictMode":true}},
]

export const MODEL_PROFILES_BY_ID: ReadonlyMap<string, GeneratedModelProfile> = new Map(
  MODEL_PROFILES.map(profile => [profile.id, profile]),
)
