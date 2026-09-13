# Розвідка: CS2 tactical hub

React/Vite застосунок для тактик, гранат і відеопосилань по картах CS2.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Без `.env.local` застосунок працює у preview-режимі з локальними seed-даними. Зміни не зберігаються після перезавантаження.

## Supabase

1. Створіть проєкт у Supabase.
2. Відкрийте SQL Editor і виконайте [`supabase/schema.sql`](supabase/schema.sql).
3. Скопіюйте Project URL та anon key у `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Для production-сторінки не використовуйте service-role key у frontend. Якщо доступ має бути справді обмеженим, додайте Supabase Auth і RLS-політики для `authenticated` користувачів. GitHub Pages сам по собі не є механізмом захисту сторінки паролем.

## GitHub Pages

1. Створіть приватний GitHub repository і запуште цей проєкт у гілку `main`.
2. У `Settings -> Pages` виберіть `GitHub Actions` як Source.
3. Додайте repository secrets `VITE_SUPABASE_URL` і `VITE_SUPABASE_ANON_KEY`.
4. Workflow [`deploy.yml`](.github/workflows/deploy.yml) збере і опублікує сайт після push.

Важливо: приватність GitHub Pages залежить від типу GitHub акаунта та плану. Звичайний Pages URL не гарантує доступ тільки "тим, у кого є посилання". Для гарантованого контролю доступу потрібна автентифікація в застосунку або hosting з access control.
