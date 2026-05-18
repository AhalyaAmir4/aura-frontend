# AURA Attendance System — React Frontend

## Quick Start

### Prerequisites: Node.js 18+, npm

### Setup
```bash
npm install
```

Configure `.env.local`:
```env
VITE_API_URL=http://localhost:8080/api
```

Start dev server:
```bash
npm run dev
```
Opens on **http://localhost:5173**

## Auth Flow
1. Login at `/login` → POST `/api/auth/login`
2. JWT token saved in `localStorage` as `aura_token`
3. All API calls auto-attach `Authorization: Bearer <token>`
4. Roles: `admin`, `teacher`, `student` — each gets their own dashboard

## Key Files Changed (Supabase → Spring Boot)
- `src/lib/api.ts` — new Axios client (replaces Supabase client)
- `src/hooks/useAuth.tsx` — JWT-based auth (replaces Supabase Auth)
- `src/pages/Login.tsx` — calls `/api/auth/login`
- `src/pages/Register.tsx` — calls `/api/auth/register`
- `src/pages/AdminDashboard.tsx` — calls `/api/admin/*`
- `src/pages/TeacherDashboard.tsx` — calls `/api/teacher/*`
- `src/pages/StudentDashboard.tsx` — calls `/api/student/*`
- `src/components/DashboardLayout.tsx` — uses JWT auth

## Build for Production
```bash
npm run build
```
Set `VITE_API_URL` to your production Spring Boot URL.
