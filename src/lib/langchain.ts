import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Pay-as-you-go DashScope (use with sk- / sk-ws-… keys).
 * Token Plan keys (sk-sp-…) are for coding tools only — not app backends.
 */
const BASE_URL =
  process.env.QWEN_BASE_URL ??
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export const QWEN_MODEL = process.env.QWEN_MODEL ?? "qwen3.7-plus";

export function requireQwenKey(): string {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY is required. No mock/fallback mode — set it in .env.local.",
    );
  }
  return apiKey;
}

export function hasQwenKey(): boolean {
  return Boolean(process.env.DASHSCOPE_API_KEY);
}

/**
 * LangChain ChatOpenAI → Alibaba DashScope / Qwen Cloud (live only).
 * Thinking OFF by default — qwen3.7-plus thinking makes sample runs time out.
 */
export function getQwenChatModel(options?: {
  temperature?: number;
  json?: boolean;
}): ChatOpenAI {
  const apiKey = requireQwenKey();

  return new ChatOpenAI({
    model: QWEN_MODEL,
    temperature: options?.temperature ?? 0.2,
    apiKey,
    configuration: { baseURL: BASE_URL },
    modelKwargs: {
      enable_thinking: false,
      ...(options?.json
        ? { response_format: { type: "json_object" } }
        : {}),
    },
  });
}

function parseJsonStrict<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Qwen returned non-JSON content: ${raw.slice(0, 200)}`);
  }
}

/** Live LangChain JSON call — throws if key missing or response invalid. */
export async function langchainJson<T>(params: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<{ data: T; raw: string }> {
  const llm = getQwenChatModel({
    temperature: params.temperature ?? 0.2,
    json: true,
  });

  const response = await llm.invoke([
    new SystemMessage(params.system),
    new HumanMessage(params.user),
  ]);

  const raw =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return { data: parseJsonStrict<T>(raw), raw };
}

/** Live LangChain text call — throws if key missing. */
export async function langchainText(params: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const llm = getQwenChatModel({
    temperature: params.temperature ?? 0.4,
    json: false,
  });

  const response = await llm.invoke([
    new SystemMessage(params.system),
    new HumanMessage(params.user),
  ]);

  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

export const qwenJson = langchainJson;
export const qwenText = langchainText;
