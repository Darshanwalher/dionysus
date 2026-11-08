# Dionysus — AI Codebase Intelligence & Collaboration Platform

Dionysus is an AI-powered developer intelligence platform that transforms raw source code and team meetings into interactive architecture maps, dependency DAGs, meeting action items, and automated technical knowledge bases.

---

## ⚡ Key Capabilities

### 1. Interactive Architecture & Dependency Graph
* **Subsystem Boundary Mapping**: Visualizes presentation, API gateway, controllers, business services, persistence, and external AI integrations in layered cluster containers.
* **Curved Dotted Connectors with Status Badges**: DoubleLoop & Linear-inspired data flow lines with inline correlation/protocol pill badges (`+0.998`, `HTTP`, `SQL`, `-0.644 Cycle!`).
* **Blast Radius & Impact Mode**: Click any component to instantly trace upstream callers (in sky blue) and downstream dependents (in emerald), dimming unrelated nodes.
* **Full-Bleed Canvas with Blueprint Dot Grid**: High-contrast, theme-aware dot canvas with smooth wheel zooming and vertical scrollbar navigation.

### 2. Meeting Transcription & Audio Intelligence
* **Speech-to-Text Transcription**: Powered by AssemblyAI for multi-speaker recognition and timestamps.
* **AI Action Item Extraction**: Automatically converts transcribed discussions into actionable engineering items.

### 3. Codebase Q&A & Semantic Search
* **RAG Vector Search**: Embeds repository code in Pinecone and queries Google Gemini for accurate code citations and architecture explanations.

---

## 🚀 Upcoming Features Roadmap

We are actively implementing four major intelligence features. See the complete specifications in [**ROADMAP.md**](./ROADMAP.md):

1. **Repository-Based Chat Rooms**: Real-time team discussion channels scoped to each repository, featuring an embedded `@dionysus` AI agent for in-thread code citations and `#file` mentions.
2. **Database Schema Intelligence**: Automatic parsing of Mongoose schemas and Prisma files into an interactive Entity-Relationship (ER) diagram with field types and missing index warnings.
3. **Repository Health Score**: An automated 0–100 score (`A+` to `F`) evaluating architectural coupling, code complexity, dead code, and setup readiness.
4. **Repo DeepWiki**: A multi-chapter technical wiki automatically synthesized by Gemini with system overviews, API endpoint dictionaries, and interactive Mermaid diagrams.

👉 Read the full implementation plan in [**ROADMAP.md**](./ROADMAP.md).

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Tailwind CSS v4, `@xyflow/react` (React Flow), `@dagrejs/dagre`, Redux Toolkit, TipTap Editor, Lucide Icons, Sonner.
* **Backend**: Node.js, Express.js, MongoDB + Mongoose, WebSockets (`ws`).
* **AI & Language Models**: Google Gemini API (`@google/genai`), Pinecone Vector Database.
* **Audio Intelligence**: AssemblyAI, Cloudinary.
* **Version Control**: `simple-git`, Octokit (GitHub REST API).
* **Theming**: Dark & Light mode system (see [`THEME.md`](./THEME.md)).

---

## 🏁 Getting Started

### Prerequisites
* Node.js 18+
* MongoDB Atlas connection string
* Google Gemini API Key
* GitHub Personal Access Token
* AssemblyAI & Pinecone API Keys

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

Visit `http://localhost:5173` to explore Dionysus.
