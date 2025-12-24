// 1. Define the "Debug Bundle" shape:
// - Create Typescript types/interfaces for: 
//   - GenerateRequest (prompt, model?, temperature?, maxTokens?, requestId?)
//   - BundleEnv(nodeVersion, platform, hostname, serviceVersion)
//   - BundleError (type, message, providerStatusCode?, providerErrorBody?)
//   - BundleResponse (status, outputText, latencyMs, error?, providerMeta?)
//   - DebugBundle (id, createdAtMs, env request, response)

// 2. Export the types: 
// - Export them so routes.ts and storage.ts can import them. 
// server/src/types.ts

export type ProviderMeta = {
  responseId?: string;
  requestId?: string;
  model?: string;
  usage?: unknown;
  attempts?: number;
};

export type CallOpenAIArgs = {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
};

export type CallOpenAIResult = {
  outputText: string;
  latencyMs: number;
  providerMeta: ProviderMeta;
};

export type CallOpenAIError = {
  type: "rate_limit" | "timeout" | "provider_error" | "empty_output" | "unknown";
  message: string;
  providerStatusCode?: number;
  providerErrorBody?: unknown;
  latencyMs: number;
};

export interface GenerateRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  requestId?: string;
}

export interface GenerateResponse {
  id: string;
  requestId: string;
  output: string;
  latencyMs: number;
  error?: CallOpenAIError;
}

export interface BundleEnv {
  nodeVersion: string;
  platform: NodeJS.Platform;
  hostName: string;
  serviceVersion: string;
}

export interface BundleResponse {
  status: "ok" | "error";
  outputText: string;
  latencyMs: number;
  providerMeta?: ProviderMeta;
  error?: CallOpenAIError;
}

export interface DebugBundle {
  id: string;
  createdAtMs: number;
  env: BundleEnv;
  request: {
    prompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    requestId: string;
  };
  response: BundleResponse;
}


