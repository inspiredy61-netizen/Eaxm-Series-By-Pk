# Question Management update

This update replaces the read-only Admin > Question Management page with a working question editor and importer.

## Files changed
- `src/pages/QuestionManagement.jsx` (new)
- `src/App.jsx` (routes the admin questions page to the new component)
- `src/styles.css` (adds Question Management styles)

## Features
- Add and edit questions linked to an existing mock test.
- Delete questions after a confirmation prompt.
- English and optional Hindi question/option text, answer key, explanation, subject and marks.
- Search and filter questions by mock test.
- CSV/Excel template downloads, file preview and required-field/answer-key validation before import.
- Bulk imports append question positions after existing questions; existing questions are not deleted.

## Important
- Uses the existing `questions` table and columns from `supabase/schema.sql`; no database migration is required.
- Uses the existing `xlsx` dependency already added for Test Management.
- Keep your existing `vite.config.js`, `.env`, Supabase settings and all other files. Do not upload secrets.
