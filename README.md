# biofresh-sales

Sales Workspace built with Next.js App Router, React, and the temporary in-browser mock workspace.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production check

```bash
npm run build
npm run start
```

The current data layer is intentionally mock-only. It uses browser storage and a broadcast channel until server-side API, authentication, and Supabase/PostgreSQL are introduced.
