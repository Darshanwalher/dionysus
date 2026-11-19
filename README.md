<div align="center">

# 🍷 Dionysus

### AI Codebase Intelligence & Collaboration Platform

*Transform raw source code and team meetings into interactive architecture maps, automated wikis, semantic Q&A, and real-time collaborative intelligence.*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-00C8DC?style=for-the-badge)](https://pinecone.io)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Core Features](#-core-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [GitHub OAuth Setup](#-github-oauth-setup)
- [Running Locally](#-running-locally)
- [API Reference](#-api-reference)
- [Performance & Battery Optimization](#-performance--battery-optimization)
- [Contributing](#-contributing)
- [License](#-license)
- [Developed By](#-developed-by)

---

## 🚀 About The Project

**Dionysus** is a full-stack, AI-powered developer intelligence platform built to eliminate the friction of onboarding, documentation, and architectural understanding in large codebases.

Connecting to any public or private GitHub repository, Dionysus automatically:

- Generates an **interactive visual architecture map** with blast-radius tracing
- Builds a **5-chapter DeepWiki** technical knowledge base from your code
- Enables **semantic codebase Q&A** backed by vector search and Google Gemini
- Transcribes **engineering meetings** and extracts AI-generated action items
- Visualizes **database schemas** as Entity-Relationship Diagrams
- Scores **repository health** on a 0–100 scale with actionable recommendations
- Hosts **real-time team chat rooms** with an embedded `@dionysus` AI co-pilot

> Built for engineering teams who value velocity, clarity, and deep codebase understanding without manually writing a single line of documentation.

---

## ✨ Core Features

### 1. 🗺️ Interactive Architecture & Dependency Graph
- **Subsystem Boundary Mapping** — Visualizes presentation layers, API gateways, controllers, business services, persistence layers, and external AI integrations in layered cluster containers
- **Curved Dotted Connectors with Status Badges** — DoubleLoop & Linear-inspired data flow lines with inline correlation/protocol pill badges (e.g. `+0.998`, `HTTP`, `SQL`, `-0.644 Cycle!`)
- **Blast Radius & Impact Mode** — Click any component to instantly trace upstream callers (sky blue) and downstream dependents (emerald), dimming unrelated nodes
- **Full-Bleed Blueprint Canvas** — High-contrast, theme-aware dot canvas with smooth wheel zooming and vertical scrollbar navigation
- **File & Dependency Visualizer** — Cytoscape.js-powered file-level dependency graph with force-directed layout

### 2. 🤖 AI-Powered DeepWiki Generation
- Automatically generates a comprehensive **5-chapter technical wiki** from your repository source code
- Chapters cover: Project Overview, Architecture, Key Modules, Data Flow, and API Reference
- Rendered as rich Markdown with an interactive chapter tree navigator
- Supports polling for incremental wiki regeneration as the codebase evolves

### 3. 💬 Semantic Codebase Q&A (RAG)
- **Vector Embeddings via Pinecone** — Repository code chunked, embedded, and stored for high-accuracy retrieval
- **Google Gemini Integration** — Accurate code citations, architecture explanations, and function-level reasoning
- **Rich Answer Rendering** — Syntax-highlighted code blocks, file references, and markdown output
- **Conversation History** — Maintains Q&A session context per project

### 4. 🎙️ Meeting Transcription & Audio Intelligence
- **Speech-to-Text via AssemblyAI** — Upload MP3/WAV files for multi-speaker recognition with timestamps
- **AI Action Item Extraction** — Automatically converts transcribed discussions into prioritized engineering tasks
- **Meeting Archive** — Browse, replay, and search through past meeting transcripts per project

### 5. 🏥 Repository Health Scorecard
- **Automated 0–100 Score** (grades A+ to F) evaluating architectural coupling, code complexity, dead code, and setup readiness
- **Radar Chart Visualization** — Multi-axis health breakdown: Maintainability, Complexity, Documentation, Test Coverage, Security
- **Quick Fix Recommendations** — Actionable cards pointing to specific files and line ranges that need attention

### 6. 🗄️ Database Schema Intelligence
- **Automatic Mongoose & Prisma Parsing** — Detects schemas from your repository without manual configuration
- **Interactive ER Diagram** — Entity-relationship diagram with field types, relationships, and cardinality annotations
- **Missing Index Warnings** — Flags unindexed fields on high-query collections

### 7. 💬 Real-Time Team Chat with AI Co-Pilot
- **WebSocket-Powered Chat Rooms** — One room scoped per repository for focused team communication
- **`@dionysus` AI Agent** — Mention `@dionysus` in any message to get in-thread code citations and architecture answers
- **`#file` Mentions** — Reference specific files directly in chat with inline previews
- **Persistent Message History** — Full chat history stored and paginated per room

### 8. 🔐 GitHub OAuth & Repository Integration
- **GitHub OAuth 2.0 Flow** — One-click "Connect GitHub" with scopes: `read:user`, `user:email`, `repo`
- **Public & Private Repository Access** — Clones private repos using the authenticated user's access token
- **1-Click Repository Picker** — Browse all your GitHub repos (with Public/Private filter and instant search), import directly without copy-pasting URLs
- **Account Linking** — Connect GitHub to an existing local account; disconnect at any time from Settings

### 9. ⚙️ User Settings & Profile Management
- **Profile Tab** — Edit display name, email, and avatar with live preview
- **GitHub Tab** — View connection status, linked username & avatar, connect/disconnect GitHub account
- **Security Tab** — Set or change password with strength indicator (supports accounts created via GitHub OAuth with no initial password)

### 10. 🎨 Battery-Aware Animated Landing Page
- **3-Tier Performance System** — Automatically detects GPU performance tier (`high` / `mid` / `low`)
- **Battery API Integration** — Reduces animation complexity when device is on battery to preserve charge, restores full animations when plugged in
- **Smooth Lenis Scroll** — Physics-based smooth scrolling with tier-aware lerp values
- **GSAP + Framer Motion** — Cinematic scroll-triggered animations, 3D hero playground, and parallax sections

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT  (React + Vite)                        │
│                                                                       │
│  Landing Page          App Shell            Project Views             │
│  ┌──────────┐         ┌─────────────┐      ┌───────────────────┐    │
│  │ Hero3D   │         │ Sidebar Nav │      │ ArchitectureMap   │    │
│  │ Sections │         │ Command     │      │ DeepWiki          │    │
│  │ Lenis    │         │ Palette     │      │ QnA (RAG)         │    │
│  │ GSAP     │         │ GitHub Repo │      │ DependencyGraph   │    │
│  └──────────┘         │ Picker      │      │ ProjectHealth     │    │
│                        │ Chat Room   │      │ DatabaseSchema    │    │
│  Redux Toolkit         └─────────────┘      │ Meetings          │    │
│  ┌──────────────────────────────────┐       │ FileVisualizer    │    │
│  │ authSlice · projectSlice         │       └───────────────────┘    │
│  │ chatSlice · settingsSlice        │                                 │
│  └──────────────────────────────────┘                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  REST + WebSocket
┌───────────────────────────────▼─────────────────────────────────────┐
│                     SERVER  (Node.js + Express)                       │
│                                                                       │
│  Routes & Controllers                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  /auth   │ │/projects │ │ /github  │ │  /wiki   │ │  /ai     │  │
│  │  OAuth   │ │  CRUD    │ │user-repos│ │DeepWiki  │ │  Q&A     │  │
│  │  Profile │ │ link-repo│ │  clone   │ │  gen     │ │  RAG     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │/meetings │ │ /schema  │ │ /health  │ │  /chat   │               │
│  │AssemblyAI│ │  ER Diag │ │Scorecard │ │WebSocket │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                       │
│  Services                                                             │
│  github.service  · deepwiki.service  · vector.service                │
│  architecture.service · health-calculator · schema-analyzer          │
│  assembly.service · copilot.service · dependency-graph               │
│                                                                       │
│  Data Layer                                                           │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐               │
│  │  MongoDB   │  │   Pinecone   │  │  Cloudinary   │               │
│  │  Mongoose  │  │ Vector Index │  │ Audio/Avatars │               │
│  └────────────┘  └──────────────┘  └───────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 18 | UI component framework |
| [Vite](https://vitejs.dev) | 5 | Build tool & dev server |
| [Redux Toolkit](https://redux-toolkit.js.org) | 2 | Global state management |
| [React Router](https://reactrouter.com) | 6 | Client-side routing |
| [Tailwind CSS](https://tailwindcss.com) | 3 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | — | Accessible UI components |
| [GSAP](https://gsap.com) | 3 | Scroll-triggered animations |
| [Framer Motion](https://www.framer.com/motion) | 11 | Declarative animations |
| [Lenis](https://lenis.darkroom.engineering) | 1 | Smooth scroll physics |
| [Cytoscape.js](https://cytoscape.org) | 3 | Dependency graph rendering |
| [Mermaid](https://mermaid.js.org) | 11 | Diagram-as-code rendering |
| [React Flow](https://reactflow.dev) | 11 | Architecture canvas & nodes |
| [Lucide React](https://lucide.dev) | — | Icon system |
| [Monaco Editor](https://microsoft.github.io/monaco-editor) | — | In-browser code viewer |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | JavaScript runtime |
| [Express.js](https://expressjs.com) | 4 | HTTP server & routing |
| [MongoDB](https://mongodb.com) | 7 | Primary database |
| [Mongoose](https://mongoosejs.com) | 8 | ODM & schema modeling |
| [JSON Web Token](https://jwt.io) | — | Stateless authentication |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | — | Password hashing |
| [simple-git](https://github.com/steveukx/git-js) | — | Git repository operations |
| [ws](https://github.com/websockets/ws) | — | WebSocket server |
| [Multer](https://github.com/expressjs/multer) | — | File upload handling |
| [Axios](https://axios-http.com) | 1 | HTTP client for external APIs |

### AI & ML Services
| Service | Purpose |
|---|---|
| [Google Gemini](https://deepmind.google/technologies/gemini) | Code Q&A, wiki generation, action item extraction |
| [Pinecone](https://pinecone.io) | Vector database for RAG-based semantic search |
| [AssemblyAI](https://assemblyai.com) | Speech-to-text transcription with speaker diarization |
| [Cloudinary](https://cloudinary.com) | Audio file & avatar image storage/delivery |

### Developer Tools & Infrastructure
| Tool | Purpose |
|---|---|
| [GitHub OAuth 2.0](https://docs.github.com/en/apps/oauth-apps) | Repository authentication & account linking |
| [GitHub REST API v3](https://docs.github.com/en/rest) | Repository metadata, file tree, commit history |
| [Octokit](https://github.com/octokit/octokit.js) | Typed GitHub API client |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

---

## 📁 Project Structure

```
dionysus-rebuild/
├── client/                          # React frontend (Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── AppShell.jsx     # Main application shell & navigation
│   │   │   ├── motion/
│   │   │   │   ├── SmoothScroll.jsx # Lenis smooth scroll wrapper
│   │   │   │   └── usePerfTier.js   # GPU/battery performance detection
│   │   │   ├── project/
│   │   │   │   └── GithubRepoPickerModal.jsx  # 1-click repo importer
│   │   │   └── ui/                  # shadcn/ui components + github-icon
│   │   ├── pages/
│   │   │   ├── landing/             # Public landing page
│   │   │   │   ├── LandingPage.jsx
│   │   │   │   ├── Hero3D.jsx       # Three.js / GSAP 3D hero
│   │   │   │   ├── theme.js         # CSS variables & battery-aware rules
│   │   │   │   ├── usePerfTier.js   # 3-tier perf hook
│   │   │   │   ├── useSmoothScroll.js
│   │   │   │   ├── useSectionAnim.js
│   │   │   │   └── sections/        # HowItWorks, Pipeline, Graph, etc.
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AuthCallback.jsx     # GitHub OAuth callback handler
│   │   │   ├── UserSettings.jsx     # 3-tab settings page
│   │   │   ├── ProjectHome.jsx      # Project dashboard
│   │   │   ├── ArchitectureMap.jsx  # Architecture canvas
│   │   │   ├── DependencyGraph.jsx  # File-level dependency graph
│   │   │   ├── DeepWiki.jsx         # AI-generated wiki viewer
│   │   │   ├── QnA.jsx              # Semantic Q&A interface
│   │   │   ├── ProjectHealth.jsx    # Health scorecard & radar
│   │   │   ├── DatabaseSchemaView.jsx # ER diagram viewer
│   │   │   ├── Meetings.jsx         # Meeting list & upload
│   │   │   ├── MeetingDetail.jsx    # Transcript & action items
│   │   │   ├── ChatRoom.jsx         # Real-time team chat
│   │   │   └── FileVisualisation.jsx # File browser & viewer
│   │   ├── store/
│   │   │   └── slices/
│   │   │       ├── authSlice.js     # Auth state + GitHub thunks
│   │   │       ├── projectSlice.js  # Project CRUD state
│   │   │       └── chatSlice.js     # WebSocket chat state
│   │   ├── App.jsx                  # Route definitions
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js / Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── cloudinary.js        # Cloudinary setup
│   │   │   └── env.js               # Environment validation
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # Register, login, profile, OAuth
│   │   │   ├── github.controller.js # Repo link, user-repos
│   │   │   ├── project.controller.js
│   │   │   ├── ai.controller.js     # Embeddings & Q&A
│   │   │   ├── wiki.controller.js   # DeepWiki CRUD
│   │   │   ├── meeting.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── schema.controller.js
│   │   │   ├── chat.controller.js
│   │   │   └── visualization.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── upload.middleware.js # Multer + Cloudinary upload
│   │   │   └── errorHandler.js     # Global error handler
│   │   ├── models/
│   │   │   ├── User.js              # User schema (GitHub OAuth fields)
│   │   │   ├── Project.js
│   │   │   ├── WikiPage.js
│   │   │   ├── Meeting.js
│   │   │   ├── ChatMessage.js
│   │   │   ├── Commit.js
│   │   │   ├── Issue.js
│   │   │   └── Question.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # /api/auth/*
│   │   │   ├── github.routes.js     # /api/github/*
│   │   │   ├── project.routes.js    # /api/projects/*
│   │   │   ├── ai.routes.js         # /api/ai/*
│   │   │   ├── wiki.routes.js       # /api/wiki/*
│   │   │   ├── meeting.routes.js    # /api/meetings/*
│   │   │   ├── health.routes.js     # /api/health/*
│   │   │   ├── schema.routes.js     # /api/schema/*
│   │   │   └── chat.routes.js       # /api/chat/*
│   │   ├── services/
│   │   │   ├── github.service.js    # Clone, poll, private repo auth
│   │   │   ├── deepwiki.service.js  # 5-chapter wiki generation
│   │   │   ├── vector.service.js    # Pinecone embed & query
│   │   │   ├── architecture.service.js
│   │   │   ├── dependency-graph.service.js
│   │   │   ├── health-calculator.service.js
│   │   │   ├── schema-analyzer.service.js
│   │   │   ├── assembly.service.js  # AssemblyAI transcription
│   │   │   ├── copilot.service.js   # @dionysus chat co-pilot
│   │   │   ├── code-analyzer.service.js
│   │   │   ├── graph-validator.service.js
│   │   │   └── openai.service.js
│   │   ├── websocket/
│   │   │   └── chat.gateway.js      # WebSocket server & room manager
│   │   └── index.js                 # Express app + WS server entry
│   ├── .env                         # (not committed — see below)
│   └── package.json
│
├── optimize_projects.js             # Utility: batch project optimization
├── ROADMAP.md
└── README.md
```

---

## 📋 Prerequisites

Before you begin, ensure the following are installed and available:

| Requirement | Minimum Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org) | 18.x LTS | Use `nvm` or `fnm` to manage versions |
| [npm](https://npmjs.com) | 9.x | Comes with Node.js |
| [Git](https://git-scm.com) | 2.x | Required for repository cloning |
| [MongoDB](https://mongodb.com) | 7.x | Local install **or** [MongoDB Atlas](https://cloud.mongodb.com) free tier |

You will also need **accounts** and **API keys** for:

- 🔑 [Google Gemini API](https://aistudio.google.com) — for AI Q&A and wiki generation
- 🔑 [Pinecone](https://pinecone.io) — vector database (free Starter tier works)
- 🔑 [AssemblyAI](https://assemblyai.com) — meeting transcription
- 🔑 [Cloudinary](https://cloudinary.com) — audio & image file storage
- 🔑 [GitHub OAuth App](https://github.com/settings/developers) — for GitHub login and repo access

---

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dionysus-rebuild.git
cd dionysus-rebuild
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

```bash
# From the server/ directory
cp .env.example .env
# Then edit server/.env with your actual keys (see the table below)
```

---

## 🌍 Environment Variables

Create a file at `server/.env` with the following variables:

```env
# ─── Server ───────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Database ─────────────────────────────────────────────────────────────────
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/dionysus

# Or MongoDB Atlas (replace with your connection string)
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dionysus

# ─── Authentication ───────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# ─── Google Gemini AI ─────────────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key

# ─── GitHub Integration ───────────────────────────────────────────────────────
# Personal Access Token (for public repo cloning when no user OAuth token)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_personal_access_token

# OAuth App credentials (see GitHub OAuth Setup section below)
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Frontend URL (for OAuth redirects)
CLIENT_URL=http://localhost:5173

# ─── Pinecone Vector Database ─────────────────────────────────────────────────
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=dionysus

# ─── AssemblyAI (Meeting Transcription) ───────────────────────────────────────
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# ─── Cloudinary (File Storage) ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Variable Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Port the Express server listens on |
| `MONGODB_URI` | ✅ | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens — keep this private and long |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features (Q&A, wiki, copilot) |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | ✅ | Fallback PAT for cloning public repos without OAuth |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | ✅ | Must exactly match the callback URL registered in your GitHub OAuth App |
| `CLIENT_URL` | ✅ | Frontend URL — used for CORS and post-OAuth redirects |
| `PINECONE_API_KEY` | ✅ | Pinecone API key for vector embeddings |
| `PINECONE_INDEX` | ✅ | Name of your Pinecone index (create one named `dionysus`) |
| `ASSEMBLYAI_API_KEY` | ✅ | AssemblyAI key for meeting transcription |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |

---

## 🔐 GitHub OAuth Setup

GitHub OAuth enables users to sign up / log in with GitHub, and to authorize access to their **private repositories**.

### Step-by-Step

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps**
   👉 [https://github.com/settings/developers](https://github.com/settings/developers)

2. Click **"New OAuth App"** and fill in:

   | Field | Value |
   |---|---|
   | **Application name** | Dionysus (Local Dev) |
   | **Homepage URL** | `http://localhost:5173` |
   | **Authorization callback URL** | `http://localhost:5000/api/auth/github/callback` |

3. Click **"Register application"**, then copy your **Client ID** and **Client Secret** into `server/.env`.

4. The OAuth flow requests these scopes:
   - `read:user` — read user profile information
   - `user:email` — read the user's email address
   - `repo` — full access to public and **private** repositories (required for private repo cloning)

> [!IMPORTANT]
> The **Authorization callback URL** in GitHub must exactly match your `GITHUB_CALLBACK_URL` environment variable — including the protocol and port. A mismatch will cause OAuth to fail.

> [!NOTE]
> For production deployment, register a **separate** OAuth App with your production domain and update `GITHUB_CALLBACK_URL` and `CLIENT_URL` accordingly.

---

## ▶️ Running Locally

### Start the Backend Server

```bash
cd server
npm run dev
# Server starts at http://localhost:5000
# WebSocket server starts on the same port
```

### Start the Frontend Dev Server

Open a second terminal:

```bash
cd client
npm run dev
# Frontend starts at http://localhost:5173
```

### Build for Production

```bash
# Build the frontend
cd client
npm run build

# Start the production server
cd ../server
npm start
```

---

## 📡 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user with name, email, password |
| `POST` | `/api/auth/login` | ❌ | Login and receive a JWT token |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `PUT` | `/api/auth/profile` | ✅ | Update name, email, or avatar URL |
| `PUT` | `/api/auth/password` | ✅ | Change password (requires `currentPassword`) |
| `GET` | `/api/auth/github` | ❌ | Initiate GitHub OAuth flow |
| `GET` | `/api/auth/github/callback` | ❌ | GitHub OAuth callback handler |
| `DELETE` | `/api/auth/github` | ✅ | Unlink GitHub account from profile |

### GitHub — `/api/github`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/github/link-repo` | ✅ | Link a repository to a project (triggers clone + indexing) |
| `GET` | `/api/github/user-repos` | ✅ | Fetch all repos accessible to the authenticated GitHub user |
| `GET` | `/api/github/commits/:projectId` | ✅ | Get latest commits for a linked project |

### Projects — `/api/projects`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/projects` | ✅ | List all projects for the current user |
| `POST` | `/api/projects` | ✅ | Create a new project |
| `GET` | `/api/projects/:id` | ✅ | Get project details |
| `PUT` | `/api/projects/:id` | ✅ | Update project metadata |
| `DELETE` | `/api/projects/:id` | ✅ | Delete a project and all associated data |

### AI & Q&A — `/api/ai`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/embed/:projectId` | ✅ | Embed repository code into Pinecone |
| `POST` | `/api/ai/ask` | ✅ | Ask a question about the codebase (RAG) |
| `GET` | `/api/ai/questions/:projectId` | ✅ | Get Q&A history for a project |

### DeepWiki — `/api/wiki`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/wiki/generate/:projectId` | ✅ | Generate or regenerate the 5-chapter DeepWiki |
| `GET` | `/api/wiki/:projectId` | ✅ | Fetch the wiki for a project |
| `GET` | `/api/wiki/:projectId/chapter/:index` | ✅ | Get a specific wiki chapter |

### Architecture & Visualization — `/api/projects/:id`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/architecture` | ✅ | Get architecture graph data |
| `GET` | `/api/projects/:id/dependency-graph` | ✅ | Get file dependency graph |
| `GET` | `/api/projects/:id/file-tree` | ✅ | Browse repository file tree |
| `GET` | `/api/projects/:id/file` | ✅ | Read a specific file from the repository |

### Repository Health — `/api/health`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health/:projectId` | ✅ | Compute and return the health scorecard (0–100) |

### Database Schema — `/api/schema`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/schema/:projectId` | ✅ | Parse and return ER diagram data for the project |

### Meetings — `/api/meetings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/meetings/:projectId` | ✅ | List all meetings for a project |
| `POST` | `/api/meetings` | ✅ | Upload audio file and start transcription |
| `GET` | `/api/meetings/:id` | ✅ | Get meeting transcript and action items |
| `DELETE` | `/api/meetings/:id` | ✅ | Delete a meeting record |

### Chat — `/api/chat` + WebSocket

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/chat/:projectId/messages` | ✅ | Fetch paginated chat history |
| `WS` | `ws://localhost:5000` | ✅ JWT in first message | Real-time WebSocket room |

> [!NOTE]
> WebSocket authentication: after connecting, send a JSON message `{ "type": "auth", "token": "<jwt>" }` followed by `{ "type": "join", "projectId": "<id>" }`.

---

## ⚡ Performance & Battery Optimization

Dionysus's landing page includes a custom 3-tier performance system to ensure smooth animations across all device conditions:

### How It Works

```
Device State          → Performance Tier → Animation Quality
─────────────────────────────────────────────────────────────
Plugged in + High GPU → high             → Full GSAP, 3D, springs
Battery < 20% / Slow  → low              → Static fallbacks only
Battery saving mode   → mid              → Reduced shadows, no 3D
Plugged back in       → high (restored)  → Full animations resume
```

- **`usePerfTier.js`** — Detects GPU FPS via `requestAnimationFrame` over 600ms, reads `navigator.getBattery()`, and sets a `data-battery` / `data-perf` attribute on `<html>` for CSS-driven optimizations
- **Lenis Smooth Scroll** — `lerp: 0.13` on `high`, `lerp: 0.095` on `mid` for a softer feel on constrained devices
- **GSAP scrub** — `scrubFor()` returns `0.2 / 0.7 / 0.5` per tier so scroll animations don't stutter
- **3D Hero** — Idle animation loop pauses on battery to eliminate unnecessary GPU draw calls
- **CSS Rules** — `data-battery` triggers `will-change: transform` on animated elements, reduces `box-shadow` complexity, and disables blur-heavy effects

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit your changes**: `git commit -m "feat: add your feature"`
4. **Push to your branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request** against `main`

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation changes |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructure, no feature/fix |
| `perf:` | Performance improvement |
| `chore:` | Build system, dependencies |

### Code Style

- **Frontend**: ESLint (Oxlint) + Prettier — run `npm run lint` before committing
- **Backend**: Standard Node.js conventions; async/await preferred over callbacks
- **Components**: One component per file; keep pages thin, logic in hooks/services

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👥 Developed By

This project was designed, architected, and built by:

<table>
  <tr>
    <td align="center"><b>Darshan Walher</b></td>
    <td align="center"><b>Fiza Shaikh</b></td>
    <td align="center"><b>Omkar Pande</b></td>
    <td align="center"><b>Tanaya Mote</b></td>
  </tr>
</table>

---

<div align="center">

*Built with ❤️ to give every developer superpowers over their codebase.*

**[⬆ Back to Top](#-dionysus)**

</div>
