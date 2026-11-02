# EXAM SERIES BY PK

A fresh React + Vite website foundation for a railway exam preparation platform. It uses only the three services requested for launch:

1. **Supabase** — authentication, PostgreSQL database and row-level security.
2. **GitHub** — source code repository.
3. **Vercel** — website hosting and deployment.

The website interface is English-only. Exam content fields support English and Hindi text.

## Important project status

This ZIP is a clean, working project foundation with the core route structure, responsive interface, Supabase client, initial SQL schema, signup/login, profile, announcements, support request, test-taking interface and result display.

It is **not yet a production-complete exam platform**. The following blueprint items still need implementation and end-to-end verification before real students use it: admin create/edit/delete forms, full test attempt autosave/resume and offline sync, one-active-device enforcement, secure server-side scoring and answer-key protection, reattempt/visibility controls, subject-level analytics, email-change flow, account deletion processing, and full bilingual question rendering. The current browser test UI is a first implementation, not a secure final exam engine. Do not publish paid or confidential tests until those items are completed and audited.

## 1. Create the Supabase project

1. Sign in to Supabase and create a new project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase/schema.sql` from this ZIP.
4. Copy its full contents into a new SQL query and run it once on the new project.
5. In Supabase, open **Project Settings → API** (or API Keys).
6. Copy the Project URL and the public anon/publishable key. Never use or expose the `service_role` / secret key in the website.

## 2. Configure the website locally

1. Extract this ZIP.
2. Open the extracted `exam-series-by-pk` folder.
3. Create a copy of `.env.example` and name it `.env`.
4. Put your Supabase Project URL and public anon/publishable key in `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

5. Install Node.js LTS on your computer (this is a one-time development prerequisite; it is not an additional hosting platform).
6. Open a terminal in this project folder and run:

```bash
npm install
npm run dev
```

Vite will show a local address, usually `http://localhost:5173`.

To verify a production build:

```bash
npm run build
```

The generated production website is in the `dist` folder.

## 3. Create the first admin account safely

1. First, sign up using the website with the email address you intend to use as the administrator.
2. Verify the email if Supabase email confirmation is enabled.
3. In Supabase → SQL Editor, run this statement after replacing the email:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_VERIFIED_ADMIN_EMAIL';
```

4. Sign out and sign in again. The account should open `/admin`.

**Security:** Never add an admin role field to the public signup form. Never expose a Supabase service-role key in frontend code. Admin role assignment must be performed by a trusted project owner in Supabase.

## 4. Upload to GitHub

1. Create a new empty GitHub repository named `exam-series-by-pk`.
2. Upload the extracted project files (not the ZIP itself) to the repository.
3. Do not upload `.env`. It is ignored by `.gitignore`.
4. Confirm that `package.json`, `src`, `supabase`, `index.html` and `vercel.json` are visible in the repository.

## 5. Deploy on Vercel

1. Sign in to Vercel using GitHub.
2. Choose **Add New → Project** and import `exam-series-by-pk`.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. In Vercel → Project Settings → Environment Variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.
6. In Supabase → Authentication → URL Configuration, set the Vercel website URL as the Site URL and add the relevant redirect URLs, including:
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/**`
   - `http://localhost:5173/**` for local testing
7. Redeploy after changing environment variables.

## 6. Add initial exam content

The admin pages currently display database records. Full create/edit/delete management forms are a remaining implementation task. Until those are delivered, add test content only through a trusted Supabase dashboard workflow and carefully verify every record.

A test requires:
- A row in `tests`
- Four options per question in `questions` (`option_a` through `option_d`)
- A correct option value of exactly `A`, `B`, `C` or `D`
- A published test (`is_published = true`) before students can see it

## 7. Before public launch

Do not announce the platform as production-ready until these checks are completed:

- Test signup, email verification, login, logout and password reset.
- Confirm a student cannot access `/admin` or another student's data.
- Confirm only trusted admin accounts can publish/edit exam content.
- Move answer-key evaluation to a trusted server-side function before real exams.
- Verify negative marking, custom marks, result visibility and reattempt rules.
- Implement and test attempt autosave, resume, reconnect sync and offline recovery.
- Implement one-active-device policy if it remains required.
- Test mobile, tablet and desktop layouts.
- Verify Vercel routes and Supabase authentication redirects.
- Back up the database before production migrations.

## Support notes

- If the site shows a Supabase setup warning, check the Vercel environment variables and redeploy.
- If refresh on a nested page shows 404, confirm `vercel.json` exists in the repository and redeploy.
- Never paste secret keys, database passwords or service-role keys into chat, GitHub or frontend files.
