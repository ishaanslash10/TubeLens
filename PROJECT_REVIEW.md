# TubeLens Project Review

## 1. Executive Summary

TubeLens is an AI-powered YouTube companion built to transform passive video watching into active, structured learning. It currently exists as an MVP (Minimum Viable Product). The core architecture is a Next.js App Router application using Tailwind CSS, Supabase for authentication and database management, and Google Gemini as the AI provider.

The project is functional but currently in an early state. The landing page, authentication, and a base workspace shell have been implemented. The workspace includes video playback, transcript fetching, an AI chat companion, basic note-taking, and mind map generation. The transition from landing page to an anonymous session is implemented, allowing users to experience the workspace without mandatory login. However, several features act as standalone components rather than a deeply integrated learning system, and long-term features are not yet built. It is functional as a foundation but requires further polishing and feature implementation to fully realize its product vision.

## 2. Project Philosophy and Intended Product

According to the documentation (`context/PRODUCT.md` and `context/CONSTITUTION.md`), TubeLens' guiding principle is **"Understanding"**.

*   **Core Purpose**: To help users deeply understand YouTube videos rather than merely summarizing them.
*   **Philosophy**: Curiosity-driven exploration; AI should act as a thoughtful learning companion that teaches, guides, and challenges instead of just providing answers.
*   **Learning Experience**: Watch -> Explore -> Question -> Understand.
*   **Intended User Journey**: A user pastes a YouTube URL to instantly create an intelligent workspace. They can then watch the video without distraction, highlight transcripts, ask the AI contextual questions, draw conceptual maps, and save notes.
*   **Major Principles**: Clarity over visual complexity; Truth and accuracy (with timestamps and citations); Meaningful interaction over flashy AI effects.

## 3. Current Tech Stack

*   **Framework**: Next.js 16.2.9 (App Router)
*   **Frontend**: React 19.2.4
*   **Backend**: Next.js Server Actions & Route Handlers
*   **Database**: PostgreSQL (via Supabase)
*   **Authentication**: Supabase Auth
*   **AI Provider/Model**: Google GenAI (`gemini-3.6-flash` is currently hardcoded in API routes)
*   **Styling**: Tailwind CSS v4
*   **Component Libraries**: shadcn/ui, Radix UI, Base UI
*   **Animation Libraries**: Framer Motion, tw-animate-css
*   **Diagramming**: Mermaid.js
*   **Transcript Parsing**: youtube-transcript
*   **Deployment/Runtime**: Vercel (planned/assumed based on `context/TECH_STACK.md`), currently runs on Node/pnpm
*   **Package Manager**: pnpm

## 4. Application Routes

| Route | Purpose | Authentication | Status | Known Issues |
|---|---|---|---|---|
| `/` | Landing Page | Optional (Public) | Functional | None |
| `/login` | Auth Form | Public | Functional | None |
| `/workspace/[id]` | Main Learning Workspace | Optional (Anonymous or Auth) | Functional | Does not handle invalid YouTube IDs gracefully if API fails. |
| `/api/chat` (POST) | AI Chat Endpoint | Public | Functional | Hardcodes `gemini-3.6-flash`. Transcript limit is 50k chars. |
| `/api/transcript` (GET) | Fetch YouTube Transcript | Public | Functional | Depends on `youtube-transcript` which can break if YT changes API. |
| `/api/mindmap` (POST) | Generate Mermaid Mind Map | Public | Functional | Mindmap output parsing relies on regex cleanup which can be fragile. |

## 5. Landing Page

The landing page (`components/landing-page.tsx`) implements the following major sections:
*   **Navbar**: Contains navigation links and "Sign In" link. (Functional)
*   **Hero**: Contains the product value prop and URL input. The "Start a learning session" button transitions cleanly into an inline URL input form. (Functional)
*   **Product Story (Watch. Explore. Question. Understand.)**: High-level value propositions. (Visual/Marketing)
*   **Product Showcase**: Explains the workspace approach. (Visual/Marketing with simulated UI)
*   **AI Companion**: Showcases the AI chat feature. (Visual/Marketing with simulated UI)
*   **Notes + Transcript**: Showcases the note-taking and reading features. (Visual/Marketing with simulated UI)
*   **Active Learning Tools (Mind Map, Flashcards, Quizzes)**: Showcases tools. Mind map is implemented in the app, but flashcards and quizzes are **mock/visual only**.
*   **How it Works (The TubeLens Process)**: 5-step process explanation. (Visual)
*   **Value/Social**: 3 key benefits. (Visual)
*   **Final CTA**: "Start Learning Free" and "Explore TubeLens". (Functional)

## 6. Workspace

The workspace (`app/workspace/[id]/page.tsx`) creates the core product loop.
*   **Top Navigation**: Shows TubeLens logo, active session badge, Workspace ID, and either a "Sign Out" or "Sign In to Save" button depending on auth state.
*   **Video Player**: Uses a standard embedded YouTube iframe.
*   **Workspace Tabs**: Uses shadcn Tabs to switch between Transcript, Notes, and Mind Map.
*   **Transcript**: Fetches transcript from `/api/transcript` and lists timestamps. (Functional, but timestamps are not currently clickable to jump video).
*   **Notes**: Simple text area. Autosaves to Supabase if authenticated. Retains in local state if anonymous, showing an "Unsaved Session" warning.
*   **Mind Map**: Fetches Mermaid code from `/api/mindmap` and renders it. (Functional).
*   **AI Companion**: Chat interface that sends context and user messages to `/api/chat`. (Functional).

**Interaction Flow:**
1. Unauthenticated user enters URL and clicks Start Learning.
2. User is pushed to `/workspace/[id]`.
3. Server creates an anonymous context (`workspaceId = null`).
4. Video iframe loads.
5. `WorkspaceProvider` fetches transcript client-side.
6. AI Chat works using videoId.
7. Notes work in memory (alerts user to sign in).
8. Mind map generation works using videoId.
9. Clicking "Sign In to Save" redirects to `/login?next=/workspace/[id]`. After auth, a real workspace DB entry is created.

## 7. Feature Inventory

| Feature | Exists? | Functional? | Backend? | UI? | Notes |
|---|---|---|---|---|---|
| YouTube URL Processing | ✅ | ✅ | N/A | ✅ | Regex extracts ID. |
| Video Playback | ✅ | ✅ | N/A | ✅ | Basic iframe. |
| Transcript Fetching | ✅ | ✅ | ✅ | ✅ | Uses `youtube-transcript`. |
| Transcript Interaction | 🟡 | 🔴 | N/A | ✅ | UI shows transcript, but clicking doesn't seek video. |
| Notes (Text) | ✅ | ✅ | ✅ | ✅ | Basic textarea. |
| Notes Autosave | ✅ | ✅ | ✅ | ✅ | Autosaves 1.5s after typing (if auth'd). |
| AI Chat | ✅ | ✅ | ✅ | ✅ | Streams/returns responses based on transcript. |
| Mind Map Generation | ✅ | ✅ | ✅ | ✅ | Generates via AI and renders Mermaid. |
| Flashcards | 🔴 | 🔴 | 🔴 | 🔴 | Only exists as a mock on the landing page. |
| Quizzes | 🔴 | 🔴 | 🔴 | 🔴 | Only exists as a mock on the landing page. |
| Authentication | ✅ | ✅ | ✅ | ✅ | Supabase email/password. |
| Anonymous Sessions | ✅ | ✅ | N/A | ✅ | Allows usage without DB persistence. |

## 8. Backend / API Audit

*   **`/api/chat`**: Takes `{ message, videoId }`. Fetches transcript on the server, builds a system prompt instructing the AI to act as a learning companion, and queries Gemini. Returns JSON `{ text }`. *Status: Functional. Note: Transcript fetching is duplicated here instead of passed from client or DB.*
*   **`/api/transcript`**: Takes `?videoId=...`. Returns JSON `{ transcript: [...] }`. *Status: Functional.*
*   **`/api/mindmap`**: Takes `{ videoId }`. Fetches transcript on the server, instructs Gemini to generate Mermaid syntax. Returns JSON `{ mermaid }`. *Status: Functional. Note: Transcript fetching is duplicated here as well.*
*   **Server Actions (`app/login/actions.ts`)**: `login`, `signup`, `signout` interacting directly with Supabase SSR. *Status: Functional.*

## 9. Database / Supabase Audit

Based on the application code, the following schema is inferred (since I cannot inspect Supabase directly):
*   **Table**: `workspaces`
    *   Columns: `id`, `user_id`, `video_id`.
*   **Table**: `notes`
    *   Columns: `id`, `workspace_id`, `user_id`, `content`.

*Auth Integration*: Uses Supabase Auth.
*Anonymous Behavior*: Does not write to DB. `workspaceId` is kept `null`.
*Authenticated Behavior*: Creates a `workspace` row on load if missing. Notes component creates/updates a `notes` row.

## 10. AI System Audit

*   **Model**: `gemini-3.6-flash` (hardcoded).
*   **Provider**: Google GenAI.
*   **Context Handling**: The backend fetches the transcript on the fly using `youtube-transcript` and injects it into the system instruction for both Chat and Mind Map.
*   **Limitations**: Hard limits transcript to 50k characters. Does not use embeddings/RAG. Mind map parsing relies on string replacements (removing ```mermaid).

## 11. Authentication and Anonymous Experience

*   **What it does**: Controls data persistence.
*   **Required**: Nowhere.
*   **Optional**: Landing page and Workspace.
*   **Anonymous Session**: When `user` is null in `WorkspacePage`, `workspaceId` is set to `null`. The context propagates this. The Notes component detects `!workspaceId` and enables local-only mode, showing an "Unsaved Session" badge. Chat and Mind Map do not require DB persistence, so they work fully.
*   **Transition**: If an anonymous user clicks "Sign In to Save", they go to `/login` with a `next` redirect parameter. Upon login, they return to the workspace. Note: Any anonymous notes typed previously are *lost* during this redirect because they were only in React state.

## 12. UI / Component Architecture

*   **`components/landing-page.tsx`**: Monolithic landing page component.
*   **`components/workspace/workspace-context.tsx`**: React Context that manages transcript state and video ID.
*   **`components/workspace/workspace-panel.tsx`**: Renders Tabs to switch between Transcript, Notes, Mind Map.
*   **`components/workspace/notes.tsx`**: Manages debounced saving to Supabase.
*   **`components/workspace/mindmap.tsx`**: Manages mermaid rendering and AI generation call.
*   **`components/chat.tsx`**: Standard AI chat window with state.

*Concerns*: Transcript fetching logic is duplicated across the client (`WorkspaceProvider`) and two separate backend routes (`/api/chat`, `/api/mindmap`). If `youtube-transcript` fails or is slow, it happens three times.

## 13. Current Bugs / Errors / Broken Behavior

### Medium
*   **Anonymous Data Loss**: If a user writes notes in an anonymous session and then clicks "Sign In to Save", the notes are wiped because they are not persisted to `localStorage` before the redirect.
*   **Transcript Interaction**: The UI implies transcript timestamps should be interactive, but clicking them currently does nothing to the iframe player (no seeking).
*   **Redundant API Calls**: `/api/chat` and `/api/mindmap` both fetch the YouTube transcript independently on every request, which is slow, redundant, and risks rate-limiting from YouTube.

## 14. Incomplete / Partially Implemented Features

*   **Flashcards / Quizzes**: Shown on landing page, completely missing in app.
*   **Transcript Seeking**: The timestamp UI exists but has no `onClick` handler mapped to the iframe API.
*   **Note structure**: Notes are currently just a raw `<textarea>`. The design/documentation implies "Structured Notes" with tagging and timestamp linking, which is not implemented.

## 15. Technical Debt / Architecture Concerns

*   **Iframe vs YouTube API**: The project uses a raw `<iframe>` instead of the YouTube Iframe API. This means the app cannot control playback, seek to specific times, or track current watch time.
*   **Transcript Duplication**: The transcript is fetched repeatedly. It should ideally be fetched once, stored in the `workspaces` DB table, and retrieved, or passed from the client to the server.
*   **Monolithic UI**: `landing-page.tsx` is 600 lines long.
*   **AI Model Hardcoding**: `gemini-3.6-flash` is hardcoded.

## 16. Documentation vs Implementation Gap

| Intended capability | Documented expectation | Current implementation | Gap |
|---|---|---|---|
| Deep Understanding | AI guides, teaches, and questions | System prompt asks AI to be a companion, but standard chat interface is used. | Needs proactive AI prompts/suggestions to drive exploration. |
| Active Learning | Interactive Quizzes, Flashcards | Missing | Not built yet. |
| Timestamp syncing | Notes sync with timestamps automatically | Simple raw textarea | No timestamp integration in notes. |
| Research/Connect | Connect ideas across domains | Basic chat | No multi-video or web search integration. |

## 17. Current Project Completion Map

✅ **Complete**
*   Landing page visuals
*   Supabase Auth integration
*   Anonymous session flow
*   Basic AI chat integration
*   Mermaid generation

🟡 **Partially complete**
*   Transcript handling (fetched, but not interactive)
*   Notes (text only, lacks structure/timestamp sync)
*   Workspace Shell (needs YouTube Iframe API integration)

🔴 **Not implemented**
*   Quizzes
*   Flashcards
*   Notes-to-timestamp syncing

## 18. Recommended Work Order

**Phase 1: Bugs / blockers**
1. Implement the official YouTube Iframe Player API instead of a raw iframe (unlocks seeking and time-tracking).
2. Fix Transcript duplication: Fetch transcript once when workspace is created and store/pass it, rather than fetching on every API request.
3. Save anonymous notes to `localStorage` to prevent data loss when clicking "Sign In".

**Phase 2: Existing incomplete functionality**
1. Make transcript timestamps clickable to seek the video.
2. Upgrade Notes from a raw textarea to a structured editor (or simply inject current video timestamp into notes automatically).

**Phase 3: UX / polish**
1. Add empty states/loading skeletons for the workspace.
2. Refactor `landing-page.tsx` into smaller components.

**Phase 4: New features**
1. Implement Flashcards generator.
2. Implement Quizzes generator.

## 19. Open Questions

1. Should transcripts be saved to the database to prevent rate-limiting and ensure permanence, or fetched on-the-fly to save DB space?
2. How should flashcards and quizzes be stored in the database?
3. Should anonymous sessions be completely ephemeral, or should they persist in `localStorage` across page reloads?

## 20. Final State Summary

**What TubeLens can do RIGHT NOW:**
A user can seamlessly enter a YouTube URL, watch the video, read a transcript, generate a mind map, and chat with an AI contextually aware of the video's transcript. They can do this without an account, and if they sign in, their basic text notes will save to a database.

**What should be addressed before adding major new features:**
The application urgently needs to replace the raw YouTube `<iframe>` with the official YouTube Iframe API to allow the app and the video to talk to each other (seeking, pausing). Additionally, the redundant server-side transcript fetching needs to be optimized to prevent API blocks and slow response times.
