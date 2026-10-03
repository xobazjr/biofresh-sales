# Biofresh UI

## Project conventions

- This project uses React + Vite.
- Keep reusable design tokens, typography, colors, spacing, radius, shadows, and shared base styles in `src/styles/global.css`.
- Page-specific styles should live beside the page/component and should consume variables from `global.css` instead of hardcoding repeated values.
- Keep temporary/demo data in `src/data/`. Do not connect to a real database until explicitly requested.
- Data access should go through a repository/service module so the mock implementation can later be replaced with a Supabase implementation without changing UI components.
- Prefer accessible, semantic HTML and responsive layouts.

## Current scope

- Sales Workspace
- Customer history database UI
- Order status tracking UI
- Mock data only; Supabase integration is intentionally deferred.
