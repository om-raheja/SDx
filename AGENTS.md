# Medical Diagnosis App - Agent Instructions

## Project Overview
A Next.js application for medical diagnosis education where students can practice diagnostic reasoning through step-by-step case hints.

## Tech Stack
- **Frontend**: Next.js (App Router)
- **Auth**: StackAuth (Google, Microsoft, GitHub social login)
- **Database**: CrateDB (distributed SQL database)
  - Free tier: 1-node, 2 CPUs, 2 GiB memory, 8 GiB storage
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

## User Roles

### Student
- Sign up/login via social providers (Google, Microsoft, GitHub)
- View available diagnosis cases
- See cases revealed step-by-step (7 hints total)
- After each hint reveal, submit a diagnosis (locked after next hint)
- Final submit option after all hints revealed
- Cannot change diagnosis once next hint is revealed

### Teacher
- Email: `soniasethi66@hotmail.com` (configured via env var)
- Create new cases with:
  - Title
  - 7 hints (each containing: text, optional image, optional labs)
- View all student submissions with timestamps

## Database Schema (CrateDB)

### Table: users
```sql
id (TEXT, PRIMARY KEY)
email (TEXT)
name (TEXT)
role (TEXT) -- 'student' or 'teacher'
created_at (TIMESTAMP)
```

### Table: cases
```sql
id (TEXT, PRIMARY KEY)
title (TEXT)
created_by (TEXT) -- user id
created_at (TIMESTAMP)
```

### Table: hints
```sql
id (TEXT, PRIMARY KEY)
case_id (TEXT) -- foreign key to cases
hint_order (INTEGER) -- 1-7
content (TEXT) -- the hint text
image_url (TEXT, nullable)
labs (TEXT, nullable)
```

### Table: submissions
```sql
id (TEXT, PRIMARY KEY)
user_id (TEXT) -- student id
case_id (TEXT) -- foreign key to cases
diagnosis (TEXT)
submitted_after_hint (INTEGER) -- which hint triggered this submission
created_at (TIMESTAMP)
is_final (BOOLEAN)
```

## API Endpoints

### Public
- `GET /api/cases` - List all active cases (for students)

### Authenticated (Student)
- `GET /api/cases/[id]/hints` - Get hints for a case
- `POST /api/cases/[id]/submissions` - Submit diagnosis

### Teacher Only
- `POST /api/cases` - Create new case with hints
- `GET /api/submissions` - View all submissions with timestamps

## Environment Variables
```
# StackAuth
STACKAUTH_CLIENT_ID=
STACKAUTH_CLIENT_SECRET=

# CrateDB
CRATEDB_URL=
CRATEDB_USERNAME=
CRATEDB_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
TEACHER_EMAIL=soniasethi66@hotmail.com
NEXT_PUBLIC_APP_URL=
```

## Features

### Student Flow
1. Login with social account
2. See list of available cases
3. Select a case to start
4. View first hint
5. Submit diagnosis (optional on first hint)
6. Reveal next hint
7. Submit new diagnosis (previous locked)
8. Repeat until hint 7
9. Submit final diagnosis

### Teacher Flow
1. Login (verified against TEACHER_EMAIL)
2. Dashboard to create cases
3. Add title + 7 hints (text, optional image upload, optional labs)
4. View student submissions with timestamps

## Project Structure
```
├── app/
│   ├── api/
│   │   ├── cases/
│   │   ├── submissions/
│   │   └── auth/
│   ├── dashboard/
│   ├── teacher/
│   └── page.tsx
├── components/
├── lib/
│   ├── cratedb.ts
│   ├── cloudinary.ts
│   └── stackauth.ts
└── types/
```

## Notes
- Images uploaded via Cloudinary widget or direct upload
- Hint content should be concise paragraphs (1-2 sentences typical)
- Labs can be included in hints as structured text
- Submissions are immutable once next hint is revealed