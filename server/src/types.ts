// 1. Define the "Debug Bundle" shape:
// - Create Typescript types/interfaces for: 
//   - GenerateRequest (prompt, model?, temperature?, maxTokens?, requestId?)
//   - BundleEnv(nodeVersion, platform, hostname, serviceVersion)
//   - BundleError (type, message, providerStatusCode?, providerErrorBody?)
//   - BundleResponse (status, outputText, latencyMs, error?, providerMeta?)
//   - DebugBundle (id, createdAtMs, env request, response)

// 2. Export the types: 
// - Export them so routes.ts and storage.ts can import them. 

// Create Typescript types/interfaces for the Debug Bundle components

export interface GenerateRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number
    requestId?: string;
}

export interface BundleEnv {
    nodeVersion: string;
    platform: string;
    hostName: string;
    serviceVersion: string; 
}

export interface BundleError {
    type: string; 
    message: string;
    providerStatusCode?: number;
    providerErrorBody?: any;
}

export interface BundleResponse {
    status: string;
    outputText: string;
    latencyMs: number;
    error?: BundleError;
    providerMeta?: any;
}

export interface DebugBundle {
    id: string;
    createdAtMs: number;
    env: BundleEnv;
    request: GenerateRequest;
    response: BundleResponse;
}

// Export the types for use in other parts of the application
export {
    GenerateRequest,
    BundleEnv,
    BundleError,
    BundleResponse,
    DebugBundle
};

