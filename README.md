# LLM Repro & Trace Kit

A small TypeScript + React project that demonstrates:

- **LLM debugging** (reproducibility, error capture, provider IDs, usage capture, retry/backoff)
- **Infra** (Docker + Kubernetes deployment with `kind`)
- **Support mindset** (debug bundles you can hand to engineering to reproduce issues)

> Note: This project keeps OpenAI keys **server-side only**. Never commit your API key.

---

## What this app does

1) The **server** exposes:
- `POST /generate` → calls OpenAI and stores a **Debug Bundle** in SQLite  
- `GET /debug/:id` → returns the stored bundle  
- `GET /healthz` → health check  

2) The **web UI**:
- submits a prompt to `/generate`
- displays output, bundle ID, request ID, latency
- fetches and renders `/debug/:id`

A Debug Bundle includes:
- request parameters (prompt, model, temperature, maxTokens, requestId)
- env fingerprint (node version, platform, host, service version)
- provider metadata (OpenAI response ID + request ID + token usage)
- latency and retry attempt count

---

## Prerequisites

- Node.js (you’re currently using Node 24.x)
- npm
- OpenAI API key
- (Optional) Docker Desktop
- (Optional) kind + kubectl for Kubernetes

---

## Repo structure

```txt
.
├── server/                 # Fastify API + SQLite debug bundle storage
├── web/                    # React UI (Vite)
├── k8s/                    # Kubernetes manifests (ConfigMap/Deployment/Service + placeholder secret)
└── package.json            # npm workspaces
