// src/routes.ts 
// This file defines the routes for the server application.
// Add two temporary test routes
// Route 1: POST /_debug/seed
// -- Import `saveBundle` from storage
// -- bundle types + UUID generator (either built in crypto UUID or small UUID library)
// 2. Handler behavior:
// -- Create a dummy DebugBundle object with: 
// --- id: new UUID
// --- env fingerprint fields
// --- request: a fake promopt + params
// -- response: status ok, outputText "seeded bundle", latencyMs 0
// -- Save it via saveBundle
// -- Return `{ id: bundleId }` as JSON response

// File server/src/routes.ts 
{ /* 
1. Keep existing
--- `GET / healthz`
--- `GET /debug/:id`
--- Optional keep `POST /_debug/seed` for now
2. Add `POST /generate`
--- Handler Steps: 
--- Validate Body: 
---- `prompt` (string, required)
---- `temperature` (number, optional, default 0.2)
---- `maxTokens` (number, optional, default 100)
---- `model` (string, optional, default "gpt-4")
--- Create bundleId + requestId (UUIDs)
--- Build `env fingerprint` (node version, platform, hostname, serviceVersion)
--- Call `callOpenAI()`
--- Save DebugBundle (always, success or error)
--- Return minimal response: 
---- `{ id, requestId, output, latencyMs, error? }`
*/}

import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import { saveDebugBundle, getDebugBundle } from "./storage.js";
import type { DebugBundle, BundleEnv, GenerateRequest, BundleResponse } from "./types.js";
import { callOpenAI } from "./llm_client.js";

export default function registerRoutes(app: FastifyInstance) {
    // Health check route
    app.get("/healthz", async (request, reply) => {
        return reply.send({ status: "ok" });
    });

    // app.get("/debug/:id") 
    app.get("/debug/:id", async (request, reply) => {
        const { id } = request.params as { id: string }; 
        const bundle = getDebugBundle(id);
        if (!bundle) {
            return reply.code(404).send({ message: "Bundle not found" });
        } else {
            return reply.send(bundle); 
        }
    });
    // Temporary test route to seed a debug bundle
    app.post("/_debug/seed", async (request, reply) => {
        // Create a dummy DebugBundle object with required fields
        const bundleId = uuidv4();
        const env: BundleEnv = {
            nodeVersion: process.version,
            platform: process.platform,
            hostName: os.hostname(),
            serviceVersion: "1.0.0" // Example service version
        };

        const req: GenerateRequest = {
            prompt: "This is a seeded debug bundle.",
            model: "gpt-4",
            temperature: 0.7,
            maxTokens: 150,
            requestId: uuidv4()
        };

        const res: BundleResponse = {
            status: "ok",
            outputText: "seeded bundle",
            latencyMs: 0
        };

        const debugBundle: DebugBundle = {
            id: bundleId,
            createdAtMs: Date.now(),
            env,
            request: req,
            response: res
        };

        // Save the debug bundle using the storage function
        await saveDebugBundle(debugBundle);

        // Return the bundle ID as JSON response
        return reply.send({ id: bundleId });
    });

    // New route: POST /generate
    {/* 
        1. Log before calling OpenAI: `generate: calling openai` + bundleId
        2. Log after OpenAI returns: `generate: openai returned` + latencyMs + output length
        3. In the catch block, log: `generate: openaierror` + error message + status code if available
        Restart the server and make one request to /generate to see the logs in action.

        Additonally, the /generate route should be async. When you call the client wrapper: result = await callOpenAI(...). 
        In callOpenAI(...), 
    */}
    app.post("/generate", async (request, reply) => {
        // Validate body parameters
        const {
            prompt,
            temperature = 0.2, 
            maxTokens = 100,
            model = "gpt-4o-mini"
        } = request.body as {
            prompt: string;
            temperature?: number;
            maxTokens?: number;
            model?: string;
        }
        if (!prompt || typeof prompt !== "string") {
            return reply.code(400).send({ message: "Invalid or missing 'prompt' in request body" }); 
        } else if (temperature && typeof temperature !== "number") {
            return reply.code(400).send({ message: "temperature must be a number" });
        } else if (maxTokens && typeof maxTokens !== "number") {
            return reply.code(400).send({ message: "maxTokens must be a number" });
        } else if (model && typeof model !== "string") {
            return reply.code(400).send({ message: "model must be a string" });
        }

        // Create bundleId and requestId
        const bundleId = uuidv4();
        const requestId = uuidv4();

        // Build env fingerprint
        const env = {
            nodeVersion: process.version, 
            platform: process.platform, 
            hostName: os.hostname(),
            serviceVersion: "1.0.0" // Example Service Version
        }

        // Call OpenAI API (assuming `callOpenAI` is defined elsewhere)
        let bundleResponse: BundleResponse;
            console.log(`generate: calling openai - bundleId: ${bundleId}`);
        try {
            const aiResult = await callOpenAI({ prompt, model, temperature, maxTokens });
            console.log(`generate: openai returned - latencyMs: ${aiResult.latencyMs}, outputLength: ${aiResult.outputText.length}`);
            bundleResponse = {
                status: "ok",
                outputText: aiResult.outputText,
                latencyMs: aiResult.latencyMs,
                providerMeta: aiResult.providerMeta
            };
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            const errorDetails = error && typeof error === "object" ? (error as any) : {};
            bundleResponse = {
                status: "error",
                outputText: "",
                latencyMs: errorDetails.latencyMs || 0,
                error: {
                    type: errorDetails.type || "UnknownError",
                    message: errorObj.message || "An unknown error occurred",
                    providerStatusCode: errorDetails.providerStatusCode,
                    providerErrorBody: errorDetails.providerErrorBody,
                    latencyMs: errorDetails.latencyMs || 0
                }
            };
            console.log(
                `generate: openaierror - message: ${errorObj.message}, statusCode: ${errorDetails.providerStatusCode}`
            );
        }
        // Build the complete DebugBundle object
        const debugBundle: DebugBundle = {
            id: bundleId,
            createdAtMs: Date.now(),
            env,
            request: {
                prompt,
                model,
                temperature,
                maxTokens,
                requestId
            },
            response: bundleResponse
        }
        // Save the DebugBundle
        await saveDebugBundle(debugBundle);
        
        // Return minimal response
        const responsePayload: any = {
            id: bundleId, 
            requestId,
            output: bundleResponse.outputText,
            latencyMs: bundleResponse.latencyMs
        }
        if (bundleResponse.status === "error" && bundleResponse.error) {
            responsePayload.error = bundleResponse.error;
        }
        return reply.send(responsePayload);
    }); 
}    