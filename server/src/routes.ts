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

import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import { saveDebugBundle, getDebugBundle } from "./storage.ts";
import type { DebugBundle, BundleEnv, GenerateRequest, BundleResponse } from "./types";

export default function registerRoutes(app: FastifyInstance) {
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
}


    