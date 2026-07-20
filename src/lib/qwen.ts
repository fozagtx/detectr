/**
 * Compatibility shim — Detectr LLM calls go through LangChain (live only).
 * @see ./langchain.ts
 */
export {
  QWEN_MODEL,
  getQwenChatModel,
  hasQwenKey,
  requireQwenKey,
  langchainJson,
  langchainText,
  langchainJson as qwenJson,
  langchainText as qwenText,
} from "./langchain";
