# TUBELENS: SYSTEM ARCHITECTURE & PROJECT BIBLE

**Document Status:** Current as of 2026-09-20
**Role:** System Architect / Product Architect Guide
**Methodology:** Verified via source code inspection.

---

## PART 1 — PRODUCT PURPOSE

### 1. What TubeLens Is
TubeLens is an AI-powered active research workspace built around YouTube videos.

### 2. Core Product Philosophy
"Understanding." TubeLens prioritizes clarity, meaningful interactions, and long-term knowledge retention over passive consumption or quick summaries.

### 3. The Intended User Journey
A user provides a YouTube URL → TubeLens generates a dedicated workspace → The user watches the video alongside a synchronized transcript, takes structured notes, generates visual mind maps, and asks an AI Companion for targeted insights, quotes, and timestamped citations.

### 4. What Problem TubeLens Solves
YouTube is fundamentally optimized for passive viewing. TubeLens solves the problem of using YouTube as an educational/research tool by coupling video playback with a side-by-side active-learning toolset.

### 5. What TubeLens Currently Does (IMPLEMENTED)
- Embeds YouTube video playback with native seeking and playback state synchronization.
- Handles restricted videos (Error 150/101) with a guided Picture-in-Picture fallback.
- Retrieves and normalizes YouTube transcripts (seconds-based offsets).
- Synchronizes AI Chat to the transcript, producing clickable citations `[cite:ID]` that seek the video.
- Provides a Mermaid-based Mind Map generator summarizing the video transcript.
- Provides structured Notes with `localStorage` (anonymous) and Supabase (authenticated) persistence.

### 6. What TubeLens Promises but Does NOT Implement
- Flashcards and Quizzes (Mocked/Planned - strictly prohibited in current scope).
- Audio/Speech-to-Text generation (TubeLens relies entirely on existing YouTube captions).

---

## PART 2 — COMPLETE TECH STACK

- **Next.js (16.2.9):** The core React framework using the App Router. Provides server-side rendering, API routes, and static generation.
- **React (19.2.4):** UI library.
- **TypeScript:** Type safety across the application.
- **Tailwind CSS (v4):** Core styling engine.
- **Supabase (`@supabase/ssr`, `@supabase/supabase-js`):** Database and Authentication provider. Handles `workspaces` and `notes` tables with Row Level Security (RLS).
- **Gemini (`@google/genai` 2.22.0):** The AI engine powering the Chat Companion and the Mind Map generator. Model: `gemini-3.6-flash`.
- **YouTube IFrame API:** External script (`https://www.youtube.com/iframe_api`) used to render and control the video natively.
- **Youtube-Transcript (`youtube-transcript` 1.3.1):** Unofficial library used server-side to scrape/fetch captions from YouTube.
- **Framer Motion (`framer-motion` 11.2.0):** Used for micro-animations (e.g., chat message entrances).
- **Lucide React (`lucide-react`):** Iconography library.
- **Mermaid (`mermaid` 12.0.0):** Client-side SVG graph rendering library used exclusively for the Mind Map feature.

---

## PART 3 — HIGH-LEVEL SYSTEM ARCHITECTURE

```text
USER
 ↓
NEXT.JS APPLICATION (App Router)
 ↓
WORKSPACE (/app/workspace/[id]/page.tsx)
 ├── WorkspaceProvider (Source of truth for video/transcript state)
 │
 ├── Video/Playback Layer (YouTubePlayer)
 │    ↳ Depends on: WorkspaceContext, External YouTube API
 │
 ├── Transcript Layer (WorkspacePanel -> Transcript)
 │    ↳ Depends on: WorkspaceContext (populated by /api/transcript)
 │
 ├── AI/Research Layer (Chat)
 │    ↳ Depends on: WorkspaceContext (reads transcript), /api/chat
 │
 ├── Mind Map Layer (MindMap)
 │    ↳ Depends on: WorkspaceContext (reads transcript), /api/mindmap, Mermaid.js
 │
 └── Notes Layer (Notes)
      ↳ Depends on: WorkspaceContext (workspaceId), Supabase (Auth/DB), localStorage
```

**Independence:**
The Video, Notes, and AI modules are structurally independent React siblings. However, AI, Mind Map, and Transcript viewing all possess a *data dependency* on the successful retrieval of the Transcript. Notes are entirely independent of the video/transcript.

---

## PART 4 — COMPLETE DATA FLOW

**Trace of a User Session:**
1. **URL Input:** User navigates to `/workspace/[videoId]`.
2. **Workspace Creation:** `page.tsx` (Server) checks Supabase auth. If authenticated, it fetches or creates a `workspace` record and passes `workspaceId` and `videoId` to `WorkspaceProvider`.
3. **Workspace Initialization:** `WorkspaceProvider` mounts, initializing `isLoadingTranscript = true` and `currentTime = 0`.
4. **YouTube Player Initialization:** `YouTubePlayer` injects the external YouTube IFrame script, creates `YT.Player`, and hooks up `onStateChange` and `onError` events.
5. **Transcript Retrieval:** `WorkspaceProvider`'s `useEffect` calls `GET /api/transcript?videoId=...`.
6. **Transcript Normalization:** The server route calls `YoutubeTranscript.fetchTranscript`, normalizes `offset`/`duration` from milliseconds to standard seconds, and returns it.
7. **Workspace State:** `WorkspaceProvider` sets `transcript` state.
8. **Chat Request:** User types a question. `Chat` component maps the transcript into a numbered string (`[0] text... \n [1] text...`) and POSTs to `/api/chat`.
9. **Gemini Execution:** Server route passes the prompt and transcript to Gemini with strict instructions to output `[cite:ID]`.
10. **Chat Response:** Streamed/returned to the client.
11. **Citation Parsing:** `renderMessageContent` uses regex `/(\[\s*cite:\d+(?:\s*;\s*cite:\d+)*\s*\])/g` to intercept citations, looks up `transcript[id].offset`, and renders a clickable React `<button>`.
12. **Timestamp Seeking:** Clicking the button calls `seekTo(offset)` on `WorkspaceContext`, which invokes `playerRef.current.seekTo()`.
13. **Notes (Parallel):** User types in Notes. `onChange` triggers a 1.5s debounce saving to Supabase (if authenticated) or `localStorage` (if anonymous).

---

## PART 5 — VIDEO PLAYBACK ARCHITECTURE

**VERIFIED BEHAVIOR:**
1. TubeLens **does not** download or stream the video directly.
2. TubeLens **does not** own the video DOM element. It embeds a cross-origin YouTube iframe.
3. The YouTube IFrame API allows TubeLens to send commands (`playVideo`, `seekTo`) and listen to events (`onStateChange`).
4. TubeLens **cannot** access the raw video buffer or internal DOM events.
5. `currentTime` tracks seconds elapsed. `seekTo()` accepts seconds.
6. **Error 150/101:** YouTube throws these when a video owner disables embedding. TubeLens intercepts this via `onError`, sets `playerError` in context, and safely hides the broken iframe (`opacity-0`).
7. **Picture-in-Picture Fallback:** For Error 150/101, TubeLens renders a guided fallback advising the user to "Continue on YouTube" natively and activate their browser's native PiP mode, while TubeLens remains open as the research workspace.
8. **Boundaries:** Playback control (IFrame API) is strictly separated from Video Metadata/Content (Transcript API).

---

## PART 6 — TRANSCRIPT ARCHITECTURE

**CRITICAL SYSTEM BEHAVIOR (VERIFIED):**

1. **Source:** TubeLens obtains transcripts exclusively from the unofficial `youtube-transcript` npm library, which scrapes YouTube's internal caption API.
2. **Speech-to-Text:** TubeLens **DOES NOT** perform audio processing or STT.
3. **Availability:**
   - Captions exist → Retrieves successfully.
   - Auto-generated captions exist → Retrieves successfully.
   - No captions / Disabled captions → Fails.
4. **Return Structure:** The library returns `{ text, offset, duration, lang }`.
5. **Unit Boundary Fix:** `youtube-transcript` v1.3.1 returns `offset`/`duration` in **milliseconds**. `app/api/transcript/route.ts` explicitly divides these by 1000 to normalize the entire frontend to standard **seconds**.
6. **Client Delivery:** Passed down via `WorkspaceContext` as an array. UI maps over the array and formats offsets mathematically (`Math.floor(offset / 60)`).
7. **Dependency Coupling:** Transcript retrieval is executed via a separate HTTP request. It **does not depend** on the iframe. A video can throw Error 150 (embedding disabled) and the transcript will still load successfully.
8. **Failure Path:** If transcript fails, `transcriptError` is populated. The UI displays "Limited Context". Chat and Mind Map still function, but Gemini will lack grounding data.

---

## PART 7 — AI / GEMINI ARCHITECTURE

1. **Model:** `gemini-3.6-flash`.
2. **Caller:** Server-side API (`/api/chat`).
3. **Payload:** Client sends the user `message`, `videoId`, and the raw `transcriptText`.
4. **Transcript Formatting:** `[0] text \n [1] text ...`
5. **Context Limit:** The client payload slices `transcriptText` to a maximum of **50,000 characters** to fit payload/context windows.
6. **System Instructions:** Gemini is strictly instructed to output `[cite:ID]` tags when referencing video moments.
7. **Timestamp Validation:** Gemini DOES NOT calculate timestamps (it would hallucinate). It outputs the ID. The `Chat` client component parses the ID, validates it against `transcript[id]`, looks up the true `offset`, and renders the UI.
8. **Invalid Citations:** If Gemini outputs an invalid ID, the parser safely returns `null` and ignores it.

---

## PART 8 — CHAT DATA FLOW

**Trace:**
USER: "What are the most interesting parts?"
→ `Chat` appends user message to state.
→ Evaluates `transcript` array into `"[0] hello\n[1] world"`.
→ POSTs to `/api/chat`.
→ Next.js server calls Google GenAI.
→ Gemini evaluates and streams back: "The creator says [cite:1]."
→ `renderMessageContent` intercepts `[cite:1]`.
→ Looks up `transcript[1]`. (offset: 4.5s).
→ Replaces tag with `<button onClick={() => seekTo(4.5)}>0:04</button>`.
→ Renders to User.

---

## PART 9 — MIND MAP ARCHITECTURE

- **Trigger:** Manual button click by the user.
- **Route:** `POST /api/mindmap`.
- **Data Flow:** The client passes `transcriptText` (up to 50k chars) to the route.
- **AI Task:** Gemini is instructed to return *only* raw Mermaid.js syntax (`mindmap \n root \n ...`).
- **Rendering:** The client uses `mermaid.render()` to generate an SVG and injects it into a `div`.
- **Failure:** If transcript is absent, it executes anyway but relies solely on Gemini's pre-trained knowledge of the video title/subject (which is highly limited).

---

## PART 10 — NOTES ARCHITECTURE

- **Anonymous Mode:** Notes are immediately written to `localStorage` using key `tubelens-anonymous-notes-[videoId]`.
- **Authenticated Mode:** Notes are persisted to Supabase table `notes` tied to `workspace_id` and `user_id`.
- **Autosave:** 1.5-second debounce loop on the textarea `onChange`.
- **Recovery:** Upon login, if anonymous notes exist in `localStorage` for that video, the `Notes` component merges them into the authenticated Supabase note and clears `localStorage`.
- **Dependencies:** Notes are structurally decoupled from all video/transcript mechanisms.

---

## PART 11 — AUTHENTICATION & DATABASE

- **Provider:** Supabase Auth (SSR).
- **Schema:**
  - `workspaces` (id, user_id, video_id, timestamps)
  - `notes` (id, workspace_id, user_id, content, timestamps)
- **RLS:** Strictly enforced. Users can only SELECT/INSERT/UPDATE their own records.
- **Anonymous Usage:** The app gracefully degrades. `workspaceId` remains `null`. Notes fallback to localStorage. The UI actively reminds the user they are in an unsaved session.

---

## PART 12 — API ROUTES

| Route | Purpose | Input | Output | External Dependency | Client Caller | Failure Modes |
|---|---|---|---|---|---|---|
| `GET /api/transcript` | Fetch/normalize captions | `?videoId=` | `{ transcript: [...] }` | `youtube-transcript` | `WorkspaceProvider` | 500 (No captions / API block) |
| `POST /api/chat` | AI Companion Chat | `{ message, videoId, transcriptText }` | `{ text }` | `gemini-3.6-flash` | `Chat` | 500 (API error / quota) |
| `POST /api/mindmap` | Generate Mermaid graph | `{ videoId, transcriptText }` | `{ mermaid }` | `gemini-3.6-flash` | `MindMap` | 500 (API error / formatting error) |

---

## PART 13 — STATE MANAGEMENT

**`WorkspaceContext` (Source of Truth for Session):**
- **Owns:** `videoId`, `workspaceId`, `transcript`, `isLoadingTranscript`, `transcriptError`, `currentTime`, `playerReady`, `playerState`, `playerError`.
- **Read by:** `Chat` (transcript, seekTo), `MindMap` (transcript), `Notes` (workspaceId), `WorkspacePanel` (transcript rendering).
- **Written by:** `WorkspaceProvider` (transcript fetch), `YouTubePlayer` (playerState, currentTime, playerError).
- **Resets:** Tied to `videoId` dependency in `useEffect`. Changing the video entirely resets the context, avoiding state poisoning.

---

## PART 14 — FAILURE MODES

1. **Error 150/101 (Embedding Disabled):** Player UI replaced with PiP fallback. Transcript and Chat still work. (Handled gracefully).
2. **No Captions / Transcript Failure:** `/api/transcript` returns error. Context sets `transcriptError`. Chat operates in "Limited Context" (cannot cite). MindMap generates blindly. (Handled gracefully).
3. **Gemini Failure:** `/api/chat` fails. UI shows polite error message. (Handled gracefully).
4. **Invalid Gemini Citation:** Parser ignores it. UI renders nothing for that tag. (Handled gracefully).
5. **Anonymous Note Save Failure:** Saved locally. Lost on browser clear. (Expected behavior).

---

## PART 15 — CAPABILITY MATRIX

| Condition | Video | Transcript | Chat | Mind Map | Notes | AI Timestamps |
|---|---|---|---|---|---|---|
| Embeddable + Captions | Yes | Yes | Yes | Yes | Yes | Yes |
| Embeddable + No Captions | Yes | No | Yes (Limited) | Yes (Limited) | Yes | No |
| Unembeddable + Captions | PiP Fallback | Yes | Yes | Yes | Yes | Yes |
| Unembeddable + No Captions| PiP Fallback | No | Yes (Limited) | Yes (Limited) | Yes | No |
| Video has No Audio | Yes | No | Yes (Limited) | Yes (Limited) | Yes | No |
| Transcript API Blocked | Yes | No | Yes (Limited) | Yes (Limited) | Yes | No |
| Gemini Down | Yes | Yes | Fails | Fails | Yes | N/A |

---

## PART 16 — CURRENT ARCHITECTURAL DEPENDENCIES

**Dependency Graph Highlights:**
- **AI Chat** → depends on → **Transcript Data**
- **Mind Map** → depends on → **Transcript Data**
- **Clickable Timestamps** → depends on → **IFrame Player (`seekTo`)**
- **Transcript Data** → does *NOT* depend on → **IFrame Player**
- **Notes** → does *NOT* depend on → **Anything except Supabase**

---

## PART 17 — CURRENT ARCHITECTURAL GAPS

*(Identified from code inspection, no solutions proposed)*
1. **Context Window Truncation:** `components/chat.tsx` explicitly truncates `transcriptText.slice(0, 50000)`. For extremely long podcasts, late-video context is permanently invisible to the AI.
2. **Client-Side Data Redundancy:** The client downloads the transcript, formats it, and uploads it *back* to `/api/chat` and `/api/mindmap` on every single request, wasting bandwidth.
3. **No STT Fallback:** If YouTube lacks captions, the app has no fallback transcription engine.
4. **Missing Playback Synchronization in Chat:** The chat does not automatically scroll or highlight based on the video's `currentTime`.

---

## PART 18 — FILE / COMPONENT MAP

- `app/workspace/[id]/page.tsx`: Route entry point. Handles Auth and Workspace creation. Injects layout.
- `components/workspace/workspace-context.tsx`: **CORE LAYER.** React Context provider managing all cross-component state.
- `components/workspace/youtube-player.tsx`: **VIDEO LAYER.** Mounts YouTube Iframe API. Handles Error 150 fallbacks.
- `components/chat.tsx`: **AI LAYER.** Renders chat UI. Parses `[cite:ID]`. Calls `/api/chat`.
- `components/workspace/notes.tsx`: **NOTES LAYER.** Manages Supabase/localStorage syncing.
- `components/workspace/mindmap.tsx`: **MINDMAP LAYER.** Calls `/api/mindmap`. Renders Mermaid SVG.
- `app/api/transcript/route.ts`: **API.** Fetches `youtube-transcript`. Normalizes milliseconds to seconds.
- `app/api/chat/route.ts`: **API.** Communicates with Gemini GenAI. Enforces citation prompt.

---

## PART 19 — CURRENT SYSTEM DIAGRAM

```ascii
                      +-------------------+
                      |       USER        |
                      +---------+---------+
                                | (URL / Navigation)
                      +---------v---------+
                      | NEXT.JS APP ROUTER|
                      | (/workspace/[id]) |
                      +---------+---------+
                                |
                   +------------v-------------+
                   |   WORKSPACE CONTEXT      |
                   | (State: transcript, time)|
                   +----+------+------+-------+
                        |      |      |
        +---------------+      |      +----------------+
        |                      |                       |
+-------v-------+      +-------v-------+       +-------v-------+
| YOUTUBE LAYER |      | AI CHAT LAYER |       |  NOTES LAYER  |
| (Iframe API)  |      |   (Gemini)    |       |  (Supabase)   |
+-------+-------+      +-------+-------+       +-------+-------+
        |                      |                       |
+-------v-------+      +-------v-------+       +-------v-------+
|  YouTube.com  |      | /api/chat     |       | DB: workspaces|
| (Video & PiP) |      | /api/mindmap  |       | DB: notes     |
+---------------+      +-------+-------+       +---------------+
                               |
                       +-------v-------+
                       | Transcript API|
                       | (/api/trans.) |
                       +-------+-------+
                               |
                       +-------v-------+
                       | YouTube API   |
                       | (Captions)    |
                       +---------------+
```

---

## PART 20 — EXECUTIVE ARCHITECT SUMMARY

If you are assuming the role of System Architect for TubeLens, you must understand the following non-negotiable architectural truths:

1. **Source of Truth for Video:** The external YouTube IFrame API. TubeLens does not own the media.
2. **Source of Truth for Transcript:** The unofficial `youtube-transcript` payload.
3. **Source of Truth for Timestamps:** `transcript[id].offset`. **Gemini is strictly forbidden from calculating timestamps.** It only returns structural IDs (`[cite:ID]`), which the client maps to the official transcript array to ensure 100% accuracy.
4. **Source of Truth for Notes:** Supabase (authenticated) or localStorage (anonymous).

**Biggest Limitation:** Transcript text is passed via the client in every API request and hard-truncated at 50,000 characters to prevent payload rejection, permanently blinding the AI to the end of very long videos.

**Most Important Coupling:** AI reasoning quality is entirely coupled to the availability of YouTube captions. Without captions, the application gracefully degrades into a standard video player with a generic chatbot.
