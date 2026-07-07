# Support Escalation Hub

AI-powered customer support escalation system with autonomous agent analysis, KEDB integration, and real-time diagnostics.

## Features

- **Autonomous Agent** — Analyzes tickets, classifies by tier (1/2/3), and drafts responses or handover summaries
- **Support Queue** — Track Open, Resolved, and Escalated tickets
- **KEDB Library** — Known Error Database with search and categorization
- **Setup Wizard** — Onboarding screen to configure Supabase and Gemini credentials
- **Ingress Stream** — Real-time ticket creation and monitoring

## Prerequisites

- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/apikey)
- (Optional) A [Supabase](https://supabase.com) project for persistent storage

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If credentials aren't configured, the onboarding screen will walk you through it.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API key for agent analysis |
| `SUPABASE_URL` | No | Supabase project URL (in-memory fallback if unset) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (not currently wired) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |

Credentials can also be entered via the in-app Setup Screen.

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connect your GitHub repository
2. Set environment variables in the Vercel dashboard
3. Deploy — the `vercel.json` handles routing automatically

### Manual Build

```bash
npm run build     # builds frontend + server
node dist/server.cjs   # serves production on :3000
```

## Tech Stack

- React 19 + Tailwind CSS v4 + Motion
- Express (server-side API)
- Vite (dev server & build)
- Supabase (optional persistent storage)
- Gemini API (autonomous analysis)
