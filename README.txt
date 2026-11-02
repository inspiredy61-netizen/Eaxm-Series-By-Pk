ADMIN PORTAL RESTORE + ADMIN LOGIN FIX

Replace ONLY these two files in your GitHub repository:
1. src/App.jsx
2. src/pages/Auth.jsx

This keeps the separate /admin-login page while restoring the dedicated AdminCategories, TestManagement, and QuestionManagement components in the admin routes. It does not change the Supabase database or delete any records.

After replacing both files, commit the changes and wait for Vercel deployment. Then open /admin-login and check Category Management, Test Management, and Question Management.
