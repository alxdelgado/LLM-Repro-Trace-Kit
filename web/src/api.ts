/* 
1. Define types: 
    - GenerateRequest
    - GenerateResponse
2. Create `generate()` function to send POST request to `/api/generate` with GenerateRequest body and return GenerateResponse
    - POST /api/generate
    - return JSON response as GenerateResponse
3. Create getDebugBundle(id) function to send GET request to `/api/debug-bundle/{id}` and return the response as Blob
    - GET /api/debug/${id}
    - return JSON response as Blob
4. Throw a useful error on non-2xx responses
*/

export interface GenerateRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface GenerateResponse {
    id: string;
    requestId: string;
    output: string;
    latencyMs: number;
    error?: any;
}

export interface DebugBundle {
    id: string;
    createdAtMs: number;
    env: any;
    request: any;
    response: any;
}

async function readJsonOrText(res: Response) {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function generate(request: GenerateRequest): Promise<GenerateResponse> {
    const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
    });

    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body, null, 2));
    return body as GenerateResponse;
}

export async function getDebugBundle(id: string): Promise<DebugBundle> {
    const res = await fetch(`/api/debug/${encodeURIComponent(id)}`);
    const body = await readJsonOrText(res);
    if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body, null, 2));
    return body as DebugBundle;
}

