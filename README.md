***Ajaia Docs***
A lightweight collaborative document editor built with React, Tiptap, Express, and sql.js.

**Getting Started
Prerequisites**
Node.js 18+
npm
Install & Run
cd ajaia_docsnpm installnpm run dev
Open http://localhost:5173 in your browser.

**Test Accounts**
Email
Name
alex@ajaia.com	Alex Chen
sarah@ajaia.com	Sarah Miller
mike@ajaia.com	Mike Johnson

Select any account on the login screen. Switch accounts at any time using the avatar bar at the bottom of the sidebar.

**Testing Sharing**
Sign in as Alex → create a document → click Share → grant edit access to Sarah
Click Sarah's avatar in the bottom-left sidebar to switch accounts
The shared document appears under Shared with me with an "Edit" badge
Edit the document as Sarah → switch back to Alex → changes are visible
As owner, change Sarah's permission to "Can view" → Sarah cannot save edits (403 error)
Remove Sarah's access → document disappears from her list
**Features**
1. Rich Text Editing
Bold, italic, underline, three heading levels, bullet and numbered lists, blockquotes, horizontal rules. Full keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, Ctrl+Shift+Z).

2. Document Management
Create, rename (click title), and delete documents. Auto-save with 500ms debounce. All formatting persists across page refreshes.

3. File Upload
Two distinct workflows from the bottom toolbar:

Action                             Supported Formats                         Behavior
Attach	                        .txt .md .png and more	            Saved as attachment, listed
Import	                        .txt .md	                        Content parsed and appended 

Markdown files are converted to HTML via the marked library. Plain text files are wrapped in paragraph tags. Imported content is separated from existing content with a horizontal rule.

**Sharing**
Document owners can share with any other seeded user via the Share modal.
 Two permission levels:

 1. Can edit — full read/write access
 2. Can view — read-only; write attempts return a 403 error with a toast notification
Shared documents appear in a dedicated sidebar section with a permission badge. Owners can revoke access at any time, which immediately removes the document from the sharee's list.

**Persistence**
All data is stored in a local SQLite database via sql.js (pure JavaScript, no native compilation required). The database file is written to data/ajaia_docs.db on every mutation, surviving page refreshes and server restarts.

**Scripts**
npm run dev          # Start frontend (5173) + backend (3001) concurrently
npm run build        # Build frontend + compile server TypeScript
npm start            # Run production build
npm test             # Run API integration tests (Vitest)

**Project Structure**

ajaia_docs/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Editor, Sidebar, Toolbar, Modals, UI primitives
│   │   ├── lib/             # API client, auth helpers
│   │   ├── pages/           # Home (login), EditorPage
│   │   └── index.css        # Tailwind directives + Tiptap editor styles
│   └── index.html
├── server/
│   ├── index.ts             # Express server entry point
│   ├── config.ts            # Port and upload directory configuration
│   ├── database.ts          # sql.js schema, queries, seed data
│   └── routes/              # documents.ts, uploads.ts, sharing.ts
├── tests/
│   └── api.test.ts          # 10 integration tests for documents + sharing
├── data/                    # Auto-created SQLite database (gitignored)
└── uploads/                 # Auto-created file upload directory (gitignored)

**Tech Stack**
Layer                         Choice                           Why
Frontend	           React 18, TypeScript, Vite	    Fast dev server, optimized builds
Styling	                   Tailwind CSS	                Consistent design tokens, rapid iteration
Editor	               Tiptap (ProseMirror)          	Most capable open-source rich text editor 
Backend	               Express, TypeScript	            Clear API boundaries, full control 
Database	           sql.js (SQLite in JS)	        Zero native dependencies
File Upload	                 Multer	                    Standard Express file handling
Testing	                Vitest, Supertest	            Fast, ESM-native test runner

**Environment Variables**
PORT=3001
UPLOAD_DIR=./uploads
NODE_ENV=development

*No paid dependencies, no API keys, no external services required.*