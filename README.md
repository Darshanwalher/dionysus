# Dionysus — Developer Collaboration Platform

AI-powered developer collaboration platform with automatic code documentation, codebase Q&A, commit summaries, and meeting transcription.

## Tech Stack

- **Backend**: Node.js + Express.js + MongoDB (Mongoose)
- **Frontend**: React (Vite) + shadcn/ui + Tailwind CSS
- **State Management**: Redux Toolkit
- **AI**: OpenAI (GPT-3.5/4 + Embeddings)
- **Vector DB**: Pinecone
- **Transcription**: AssemblyAI
- **Auth**: JWT (bcrypt + jsonwebtoken)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- API keys for: OpenAI, Pinecone, AssemblyAI, GitHub PAT

### Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your API keys in .env
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Environment Variables

Copy `server/.env.example` to `server/.env` and fill in all required values.

## Features

- 🔐 JWT Authentication (Register/Login)
- 📁 Project Management with team collaboration
- 🔗 GitHub Repository Integration
- 📝 AI-generated Code Documentation (TipTap editor)
- 🤖 Codebase Q&A (RAG with Pinecone + OpenAI)
- 📊 AI Commit Summaries
- 🎙️ Meeting Transcription (AssemblyAI)
- 💬 Meeting Q&A
- 🗂️ File Tree Visualisation (Mermaid)

- 🌓 Light and dark theme (toggle in the top bar; preference saved locally)

See [`THEME.md`](./THEME.md) for how theming is implemented.
