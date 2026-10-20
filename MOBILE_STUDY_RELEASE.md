# Mobile and Gemini Study Studio release — 2026-10-20

Mobile, coarse-pointer, reduced-motion and data-saving sessions use a lightweight CSS solar illustration instead of loading the WebGL scene. Desktop retains the 3D scene with lower geometry, capped pixel density, fewer stars and rendering paused when hidden/offscreen. Mobile layouts reduce animated backgrounds, preserve readable colour, enlarge touch targets and fit Urdu navigation down to a 320px viewport.

SKD Study Studio uses the server-side Gemini integration directly. It supports source notes, .txt/.md import, English/Urdu flashcards, scored quizzes, summaries, concept maps, worksheets and podcast scripts. Results can be downloaded and restored in the same browser. No Chrome extension or NotebookLM login is required. This is an independent study tool, not integration with a Google NotebookLM account.

Validation completed before release:

- 19 automated tests passed, covering assistant requests, citations, dictation, voice-call playback, study output validation, quizzes, persistence and API routing.
- TypeScript and production build passed.
- All six study formats returned valid output through real Gemini calls, including Urdu.
- Browser checks at 390px and 320px, including Urdu menu, generation, flashcards, scoring and reload persistence. At 320px, document width matches client width and no WebGL canvas is mounted.

Limits:

- Notes/results persist only in the current browser, not across devices. Imports accept text, not PDF or automatic YouTube extraction.
- General-knowledge results are labelled as not web-verified. Source excerpts are displayed only when they exactly match supplied notes.
- Existing ElevenLabs short previews are capped; no full article or long podcast audio was generated during release validation.
- Long audio jobs require a durable background worker. Vercel's current request-based deployment cannot reliably run them after a request ends, so create/resume is disabled there with an explicit message. Podcast scripts and short previews remain available.
- Existing encoded credential fallbacks in provider-pool.mjs predate this release. They are not secure secret storage; migrate them to Vercel environment variables and rotate credentials. Tests now disable these fallbacks and use isolated fixtures.

Deploy through the existing GitHub main branch integration. Verify the exact commit's Vercel status and /api/status (studyStudio true, longPodcastsAvailable false) after deployment.
