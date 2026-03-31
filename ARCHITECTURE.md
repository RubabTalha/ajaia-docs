**ARCHITECTURE**

**Architecture Notes : Scope and Prioritization**

This project is a deliberately scoped slice of a collaborative document editor. I prioritized depth in three areas:

1. **Editing experience** — the primary product surface
2. **Sharing flow** — the key multi-user interaction
3. **File import** — the most product-relevant upload behavior

Everything else was cut or minimized to ship a polished version within the 4-6 hour timebox.


**Stack Choices**

**Decision                                                        Rationale **
**sql.js over better-sqlite3**                         better-sqlite3 requires C++ build tools 

**Tiptap**                                             Best open-source rich text editor for React. 

**Express over Next.js**                               Clear API boundaries, simpler mental model 

**Tailwind CSS**                                       Fast iteration on UI, consistent design 

**Seeded auth over JWT**                                  Demonstrates sharing in two clicks
**Fixed user IDs**                                      Client and server share hardcoded user IDs



**Data Model**

users documents document_shares

┌──────────┐ ┌──────────────┐ ┌──────────────────┐
│ id (PK) │◄───────│ owner_id (FK)│ │ document_id (FK) │───► documents
│ email │ │ id (PK) │◄──────│ shared_with_id │───► users
│ name │ │ title │ │ shared_by_id(FK) │───► users
│ color │ │ content │ │ permission │
└──────────┘ │ created_at │ └──────────────────┘
│ updated_at │
└──────────────┘
│
▼
┌──────────────┐
│ attachments │
│ id (PK) │
│ document_id │
│ filename │
│ original_name│
│ mime_type │
└──────────────┘


**Key decisions:**
- Shares store an explicit `permission` column. Permission checks are a single query with no inheritance logic.
- Document content is stored as raw HTML from Tiptap. This preserves formatting exactly and avoids a separate serialization layer.
- sql.js writes the entire database to disk on every mutation (`saveToDisk()`). This is slower than WAL-mode SQLite but acceptable for demo scale and avoids async complexity.
- Foreign key constraints are defined in the schema but sql.js does not enforce them at runtime. Application code handles referential integrity (e.g., deleting shares before users).


** API Design**

All endpoints prefixed with `/api`. Authentication uses an `X-User-Id` header — stateless, simple, sufficient for seeded users.

**Documents**
GET /api/documents List owned + shared documents for user
POST /api/documents Create new document
GET /api/documents/:id Get document (checks access + returns permission)
PATCH /api/documents/:id Update title/content (checks write permission)
DELETE /api/documents/:id Delete document (owner only)

**Sharing**
GET /api/sharing/:documentId List all shares for a document
POST /api/sharing/:documentId Grant access to a user (owner only)
DELETE /api/sharing/:documentId/:shareId Revoke access (owner only)
GET /api/sharing/users/list List all users (for share modal dropdown)

**Uploads**
POST /api/uploads/:documentId Upload file (multipart form, import flag for text import)
GET /api/uploads/:documentId List attachments for a document
DELETE /api/uploads/:documentId/:attachmentId Delete attachment (write permission required)


Error format: `{ "error": "Human-readable message" }`

Status codes used: 200, 201, 400, 401, 403, 404, 409, 500.



**Frontend Architecture**

**State management**: React state + callbacks. No external library. The state tree is shallow:
- `App` — auth state (logged in or not)
- `EditorPage` — document list + active document + loading state
- Components — own their UI state (modals, form inputs, dropdowns)

**Auto-save strategy**: Title and content both use 500ms debounce. Local state updates immediately (optimistic), API call fires in background. Errors surface as non-blocking toasts.

**Editor content sync**: When switching documents, `setContent()` is called only if the incoming HTML differs from the current editor state. This prevents cursor jumps on re-renders.

**User switching**: Clicking an avatar in the sidebar writes to `localStorage` and triggers a full page re-render. The Home component validates the stored ID against the known user list before skipping the login screen, preventing stale IDs from previous versions.


**File Upload Design**

One endpoint, two behaviors controlled by an `import` query parameter:

| `import=false`           |                         `import=true` 

| Save file to `uploads/`  |                Save file to `uploads/` 
| Create attachment record |               Create attachment record 
| Done                     | Parse file content (`.txt` → paragraphs, `.md` → HTML via `marked`) 
|                          | Append parsed HTML to document content after `<hr>` 
|                          | Update document in database 

Supported file types are enforced server-side by extension check. Unsupported types return a 400 error with the list of accepted extensions.


**What I Intentionally Cut**

**Cut                                                        Why **

Real-time collaboration (OT/CRDT)                     Would consume the entire timebox. 
JWT or OAuth authentication                           Seeded users demonstrate sharing faster 
`.docx` import                                        Requires mammoth.js (complex parsing)
PDF export                                            Stretch goal
Version history                                       Schema changes + UI
Mobile responsive layout                              Document editors are desktop-first
Drag-and-drop upload                                  Button upload is sufficient and simpler
User registration                                     Scope creep
Role-based permissions beyond edit/view               Two levels cover the requirement

**Deployment Notes**

- Deployed to Railway (Node.js service)
- `npm run build` compiles TypeScript server + builds Vite client
- `npm start` runs the compiled Express server, which serves the built client as static files in production
- sql.js database lives on the filesystem — persists between requests but resets on redeploy. Acceptable for a demo. Production would use PostgreSQL or Supabase.
- Upload directory is also ephemeral on Railway. Same caveat applies.


**What I'd Build Next (2-4 hours)**

1. **Export to Markdown** — strip HTML, output `.md` file download
2. **In-editor search** — client-side text search with highlight
3. **Image paste from clipboard** — listen for paste events in Tiptap, upload to server
4. **Last-edited timestamp** — show "Edited 2 min ago" in the header
5. **Document templates** — blank, meeting notes, project brief