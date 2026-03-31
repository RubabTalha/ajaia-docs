**AI Workflow Notes**

**Tools Used**
**Tool	                                                 Purpose**
Claude (Anthropic)	                                  Architecture decisions, complex implementation
Cursor IDE	                                          Inline code completion, refactoring
GitHub Copilot	                                      Boilerplate generation, repetitive patterns


**Where AI Materially Sped Up Work**
**Tiptap editor integration **(~1.5 hours saved)Tiptap's extension system has non-obvious configuration details (extension ordering, editorProps, setContent timing). AI produced a correct initial setup with StarterKit, Underline, and proper content sync logic in one pass. Without AI, I would have spent significant time reading Tiptap docs and debugging extension conflicts.

**Database schema and query layer** (~45 minutes saved)AI generated the sql.js initialization (WASM file location handling), the full schema with constraints, the seed transaction, and the query helper functions (getOne, getAll, run) in a single attempt. The schema worked on first run.

**File upload dual-mode design **(~30 minutes saved)The idea of using a single endpoint with an import flag instead of two separate endpoints was AI's suggestion. The multer configuration with extension-based filtering and the marked integration for markdown conversion were AI-generated and correct on first attempt.

**Test suite structure **(~30 minutes saved)AI generated the Vitest/Supertest setup, the test app construction, and the full test matrix covering auth enforcement, document CRUD, sharing grants, permission enforcement, and share revocation. I refined edge cases but the structure was solid from the start.

**sql.js WASM resolution** (~20 minutes saved)sql.js requires locating its .wasm file at runtime. AI suggested the locateFile approach using createRequire to resolve the path from the installed package. This avoided a common Windows gotcha where relative paths fail in ESM modules.


*What I Changed or Rejected*
**Rejected:** JWT authenticationAI initially suggested implementing JWT token generation, verification middleware, and token refresh. I replaced this with the X-User-Id header approach **because**: (a) seeded users are simpler for reviewers, (b) the auth layer isn't being evaluated, (c) JWT adds 3+ files of code with zero product value.

**Rejected:** WebSocket real-time collaborationWhen I described the project scope, AI offered to implement Y.js for CRDT-based real-time sync. I explicitly declined — this would consume the entire timebox and the assignment doesn't require it.

**Changed:** UI layout from admin-panel to docs-styleAI initially generated a traditional toolbar-at-top layout. I redesigned to match Google Docs' pattern: sidebar navigation, inline toolbar below the title, centered white canvas. This was a deliberate product decision — the prompt says "inspired by Google Docs" and the UX should feel familiar.

**Changed:** Error handling from inline to toast systemAI generated try/catch blocks that set error state in components and rendered error messages inline. I refactored to a centralized ToastProvider context for non-blocking, auto-dismissing notifications. This is better UX for a document editor where error messages shouldn't interrupt the writing flow.

**Changed:** CSS from CSS Modules to TailwindAI suggested CSS Modules for component scoping. I chose Tailwind CSS for faster iteration, consistent design tokens via tailwind.config.js, and smaller bundle size (no runtime CSS generation).

**Rejected:** Complex file type detection via magic bytesAI proposed using the file-type library for binary file identification. I kept it simple with extension + MIME type checks. Sufficient for this scope, avoids a native dependency, and the assignment doesn't require handling spoofed file extensions.

**Rejected:** Dynamic user creationAI offered to add a registration form when I mentioned multiple users. I declined because the assignment explicitly allows simulated accounts, and a sign-up flow would add validation, duplicate handling, and UI that doesn't demonstrate any evaluated competency.

**How I Verified Correctness**
**Manual test matrix:**
**Flow	                          Steps	                                       Result**
Create & edit	    New doc → type → bold/italic/heading/list → refresh	  Content persists ✓
Auto-save	            Edit rapidly → check Network tab	              Debounced calls, no spam ✓
Rename	             Change title → sidebar updates → refresh	          Title persists ✓
Share (edit)	     Share with Sarah → switch user → open doc → edit	  Success ✓
Share (view-only)	 Change to view → switch user → attempt edit	      403 toast ✓
Revoke access	     Remove share → switch user	                          Doc gone, direct URL 404 ✓
Attach file	         Upload PNG → appears in card grid → delete	          Works ✓
Import .txt	         Upload text file → paragraphs appended	              Works ✓
Import .md	         Upload markdown → headings/lists converted           Works ✓
Invalid file	     Upload .exe	                                      Error toast  ✓
Empty title	         Create without title	                       Defaults to "Untitled Document" ✓
Delete	             Owner deletes → list refreshes → direct URL 404	  Works ✓
Non-owner delete	 Bob tries to delete Alice's doc	                  403 ✓

**Automated tests: npm test runs 10 integration tests:**

Auth enforcement (missing user ID → 401)
Document creation with title and content
Document listing
Document retrieval with permission label
Access denied for non-owner without share
Share creation with permission
Shared user can access document
View-only user cannot write (403)
Access denied after share revocation
Document deletion by owner


**UX quality checks:**

All toolbar buttons toggle with correct active state
Keyboard shortcuts work (Ctrl+B/I/U/Z, Ctrl+Shift+Z)
Toast notifications appear, auto-dismiss after 3 seconds, can be manually closed
Modal closes on Escape key and overlay click
Sidebar scroll is smooth with thin custom scrollbar
No console errors in production build
Login screen validates stored user ID before skipping


**Reflection**
AI saved approximately 3-4 hours on implementation details: library integration, boilerplate, test scaffolding, and platform-specific gotchas (sql.js WASM on Windows). The real value of my time went into product decisions: which editor layout matches user expectations, how sharing should flow so a reviewer can test it in under 60 seconds, where to draw scope boundaries, and what to explicitly cut and explain. AI accelerates execution but doesn't replace the judgment about what to build and what not to build.