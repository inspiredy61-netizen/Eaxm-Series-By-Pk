EXAM SERIES BY PK — STUDENT PORTAL UPDATE

This update changes only these existing files:
- src/pages/Pages.jsx
- src/App.jsx
- src/styles.css

Features included:
1. English / Hindi / Bilingual selection on test instructions and while taking the test.
2. Hindi question and option display using the existing *_hi database fields.
3. Test submission saves the selected answers and score, then opens the result review page.
4. Result review shows correct / wrong / not attempted for every question, the correct option, the student's selected option, and the saved explanation.
5. Performance page shows attempts, average score, best score, accuracy, answer totals and links to review each attempt.
6. Timer automatically submits when it reaches zero.

GitHub replacement instructions:
1. Open the existing repository and keep all current files.
2. Replace only the three files listed above with the matching files from this ZIP.
3. Commit the changes. Vercel should deploy from GitHub automatically.
4. Do not upload or replace .env, Supabase schema, package.json, or other files for this update.

Important:
- This update uses the existing Supabase tables and columns from the supplied project schema; no SQL migration is required.
- Hindi display depends on question_text_hi and option_a_hi through option_d_hi being populated for each question. If a Hindi field is empty, the English text is used as a fallback.
- The source environment did not have npm dependencies cached and package registry access timed out, so a full Vite production build could not be run here. Please check the Vercel deployment result after committing before testing the live site.
