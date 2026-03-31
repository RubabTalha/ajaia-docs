**Ajaia Docs — Submission**

**Contents**
**File	                                   Description**
client/	                                   React + Vite + Tailwind frontend source
server/	                                   Express + sql.js backend source
tests/	                                   Vitest API integration tests (10 tests)
README.md	                               Setup instructions, features, test accounts, tech stack
ARCHITECTURE.md	                           Stack choices, data model, API design, scope cuts
AI_WORKFLOW.md	                           AI tools used, what was changed/rejected, verification
SUBMISSION.md	                           This file
package.json	                           Dependencies and scripts
Live Deployment  
VIDEO_URL.txt	                           https://drive.google.com/file/d/1_WNjm49uFHRjMZd2vXmBdz41HOpUox5d/view?usp=drive_link
                          

**Test Accounts for Sharing Flow**
Email	                   Name                          	Purpose
alex@ajaia.com	        Alex Chen	                  Primary user — create documents and share them
sarah@ajaia.com	        Sarah Miller	              Collaborator — receives shared documents
mike@ajaia.com	        Mike Johnson	              Second collaborator — test multi-user sharing
*Switch between accounts by clicking the avatar icons at the bottom of the sidebar. No password required.*


**What Is Working**

1. Document creation and editing — Create, rename (inline title edit), rich text formatting (bold, italic, underline, H1-H3, bullet list, numbered list, blockquote, horizontal rule), auto-save with debounce, reopen after refresh.
   
2. File upload — Two modes: "Attach" (saves file as attachment, shows in card grid below editor) and "Import" (parses .txt/.md files and appends content to document). Supported types clearly stated in UI footer and README.

3. Sharing — Owner can share via modal, select user from dropdown, choose edit or view permission
   
4. Shared documents appear in separate sidebar section with permission badge.
   
5. Owner can revoke access. View-only users are blocked from writing (403).


**What I Would Build Next (2-4 hours)**

Export document to Markdown (.md file download)
In-editor text search with match highlighting
Image paste from clipboard into the editor
Document version snapshots (view history, restore previous version)
Commenter permission role (can comment but not edit content)