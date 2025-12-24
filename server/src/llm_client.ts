{ /* 
1. Import Dependencies
 -- Import OpenAi SDK
 -- Any timing helpers you need
2. Create OpenAI Client
-- Read `OPENAI_API_KEY` from env
-- Initialize OpenAI client with the key
-- If missing key --> throw clear error
3. Create a small `sleep(ms)` helper function
- On errors:
-- Input: prompt + (model, temperature, maxTokens, timeoutMs)
-- Start Timer
-- Try call OpenAI responses API: 
---- `responses.create({ model, input: prompt, ... })`
-- Return: 
---- `outputText`
---- `providerMeta` (responseId, usage if available)
---- latencyMs (time taken for the request)
-- On error: 
---- capture `statuscode` if avialable
---- capture error body/message
---- throw a strucutred error object so routes can store it in the bundle 
*/}

// server/src/llm_client.ts
import OpenAI from "openai";
import {
  type CallOpenAIArgs,
  type CallOpenAIResult,
  type CallOpenAIError,
} from "./types.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return promise;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

function getStatusCode(err: any): number | undefined {
  return err?.status ?? err?.response?.status;
}

function getProviderBody(err: any): unknown {
  return err?.error ?? err?.response?.data ?? err?.body ?? err;
}

function isRetryableStatus(status?: number) {
  return status === 429 || (typeof status === "number" && status >= 500);
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
    if(!client) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OPENAI_API_KEY in environment variables.");
        }
        client = new OpenAI({ apiKey });
    }
    return client;
}

export async function callOpenAI(args: CallOpenAIArgs): Promise<CallOpenAIResult> {
  const { prompt, model, temperature, maxTokens, timeoutMs = 60_000 } = args;
  const client = getClient();

  const maxAttempts = 3;
  const baseDelayMs = 400;
  const t0 = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await withTimeout(
        client.responses.create({
          model,
          input: prompt,
          temperature,
          max_output_tokens: maxTokens,
        }),
        timeoutMs
      );

      const latencyMs = Date.now() - t0;
      const outputText = (resp as any).output_text ?? "";

      const providerMeta = {
        responseId: (resp as any).id,
        requestId: (resp as any)._request_id,
        model,
        usage: (resp as any).usage,
        attempts: attempt,
      };

      if (!outputText || outputText.trim().length === 0) {
        const e: CallOpenAIError = {
          type: "empty_output",
          message: "OpenAI returned an empty output_text.",
          providerErrorBody: { responseId: (resp as any).id },
          latencyMs,
        };
        throw e;
      }

      return { outputText, latencyMs, providerMeta };
    } catch (err: any) {
      const status = getStatusCode(err);
      const latencyMs = Date.now() - t0;

      const structured: CallOpenAIError =
        err && typeof err === "object" && "type" in err && "latencyMs" in err
          ? err
          : {
              type:
                err?.message?.includes("Timeout") ? "timeout"
                : status === 429 ? "rate_limit"
                : typeof status === "number" ? "provider_error"
                : "unknown",
              message: err?.message ?? "Unknown OpenAI error",
              providerStatusCode: status,
              providerErrorBody: getProviderBody(err),
              latencyMs,
            };

      if (attempt < maxAttempts && isRetryableStatus(status)) {
        const backoff = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 150);
        await sleep(backoff + jitter);
        continue;
      }

      throw structured;
    }
  }

  // Unreachable, but TS wants a throw/return
  throw new Error("OpenAI call failed unexpectedly.");
}

