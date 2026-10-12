# abnormallynormalstuffs — Phase 2

Vanilla HTML/CSS/JS, Express local server, Vercel serverless API routes, and Neon PostgreSQL.

## Setup
1. Install Node.js 20+.
2. Extract the ZIP and run `npm install` in the project directory.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon connection string. Keep it private.
4. Run `npm run db:init` to create tables.
5. Place your real logo at `public/assets/Logo 1.png` (the filename/capitalization matters).
6. Run `npm run dev` and open `http://localhost:3000`.

## Neon
The schema creates `posts` and `contact_messages`. Existing JSON posts are not automatically imported; back them up and migrate them separately if needed.

## Vercel
Push to Git, import the repository in Vercel, add `DATABASE_URL` under Project Settings → Environment Variables, then deploy. Vercel discovers `api/posts.js` and `api/contact.js` automatically. Run the schema against the same Neon database using `npm run db:init` or Neon SQL Editor.

## API routes
- `GET /api/posts`: returns database posts.
- `POST /api/posts`: temporary whole-array compatibility writer, local development only. It returns 403 in production until server-side admin authentication is implemented.
- `POST /api/contact`: validates and stores contact form messages.

## Security / known limitations
- The old four-digit workspace PIN remains client-side and is not secure authentication.
- Production post mutations are intentionally disabled rather than exposing a public database write endpoint. The next backend pass must add server-side admin login and authenticated create/update/archive/delete endpoints, then update the frontend publishing workflow.
- Likes still use the existing client-side/localStorage flow; database-backed rate-limited likes are not yet implemented.
- AI quote generation is Phase 3.
- Keep `.env` out of Git. Never place database credentials or AI keys in frontend files.
