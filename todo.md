# Newsletter Platform TODO - Standalone Migration

## ✅ COMPLETED: Remove ALL Manus Dependencies

### Phase 1: Authentication System ✅
- [x] Remove Manus OAuth completely
- [x] Implement standalone JWT-based authentication (`server/auth.ts`)
- [x] Add password hashing with bcrypt
- [x] Create login/register endpoints in tRPC
- [x] Update user table schema for email/password auth
- [ ] Add password reset functionality (future enhancement)

### Phase 2: Frontend Independence ✅
- [x] Remove all VITE_ environment variable dependencies
- [x] Remove Manus analytics integration
- [x] Remove Manus OAuth portal references
- [x] Update frontend to use standalone auth (`/login` page)
- [x] Remove Manus-specific UI components
- [x] Update const.ts to return local login URL

### Phase 3: Server Infrastructure ✅
- [x] Create standalone Express server (`server/index.ts`)
- [x] Integrate Vite middleware for development
- [x] Create tRPC context with JWT auth (`server/context.ts`)
- [x] Set up tRPC procedures (`server/trpc.ts`)
- [x] Copy all service files (email, Claude, Unsplash, scheduler)
- [x] Fix database functions (`server/db.ts`)
- [x] Auto-migration system working

## 🔄 IN PROGRESS: Testing & Integration

### Current Status
- ✅ Server running on port 3000
- ✅ Frontend loading and rendering
- ✅ Login page displays correctly
- ⚠️ tRPC client communication needs debugging
- ⚠️ Authentication flow not yet tested end-to-end

### Immediate Next Steps
1. **Debug tRPC Communication**
   - Frontend mutations (login/register) not triggering
   - Check React Query configuration
   - Add console logging to debug

2. **Test Authentication Flow**
   - Create test user
   - Login with credentials  
   - Verify JWT cookie is set
   - Test protected routes

3. **Fix TypeScript Errors** (7 remaining)
   - Analytics.tsx: recentEditions property
   - NewsletterDetail.tsx: id property type
   - Other minor type issues

## 📋 Phase 4: Direct API Integrations

### Email Service ✅
- [x] Using direct Resend integration
- [x] Environment variable: `RESEND_API_KEY`
- [x] Service file: `server/email.ts`

### AI Service (Needs Update)
- [ ] Replace Manus LLM with direct Anthropic API
- [ ] Update `server/claudeAPI.ts`
- [ ] Add environment variable: `ANTHROPIC_API_KEY`
- [ ] Test content generation

### Image Service ✅
- [x] Using direct Unsplash integration
- [x] Environment variable: `UNSPLASH_ACCESS_KEY`
- [x] Service file: `server/unsplash.ts`

## 🚀 Phase 5: Railway Deployment

### Pre-Deployment Checklist
- [ ] All features tested locally
- [ ] Production build tested
- [ ] Environment variables documented
- [ ] Deployment configuration created
- [ ] Database migrations verified

### Required Environment Variables
```bash
# Database
DATABASE_URL=mysql://...

# Authentication
JWT_SECRET=your-random-secret-key

# Email (Resend)
RESEND_API_KEY=re_...

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Images (Unsplash)
UNSPLASH_ACCESS_KEY=...

# Server
NODE_ENV=production
PORT=3000
```

### Deployment Steps
1. Push code to GitHub
2. Connect Railway to repository
3. Add environment variables
4. Deploy and test
5. Configure custom domain (optional)

## 🐛 Known Issues

1. **tRPC Frontend-Backend Communication**
   - Login/register mutations not firing from browser
   - Need to add debugging/logging
   - May be React Query configuration issue

2. **TypeScript Errors (7 total)**
   - Analytics page type mismatches
   - Newsletter detail page type issues
   - Need to fix database query return types

3. **Database User Setup**
   - Existing user updated with password hash
   - Password: password123
   - Need to test login works

## 📚 Key Architecture Changes

### Before (Manus-Dependent)
- Manus OAuth for authentication
- Manus _core infrastructure
- Manus API proxies for LLM/email/images
- Manus environment variables
- Manus runtime plugin

### After (Standalone)
- JWT-based email/password auth
- Custom Express + tRPC server
- Direct API integrations (Resend, Anthropic, Unsplash)
- Standard environment variables
- Standard Vite development setup

## 🎯 Success Criteria

- [ ] User can register and login
- [ ] User can create newsletters
- [ ] User can create editions with AI
- [ ] User can add/manage subscribers
- [ ] User can send emails
- [ ] Analytics tracking works
- [ ] All features work on Railway
- [ ] Zero Manus dependencies

## 📊 Progress: ~85% Complete

**Completed**: Core infrastructure, auth system, frontend updates, API services
**Remaining**: Debug tRPC communication, test all features, deploy to Railway

**Estimated time to completion**: 2-3 hours


## 🚨 URGENT: Production Deployment Issue

- [ ] Fix "Invalid URL" errors on Railway deployment (shoeboxnews.com)
- [ ] Assets not loading: index-DMs19E1a.js returning TypeError: Invalid URL
- [ ] Check production build asset paths
- [ ] Verify server is serving static files correctly in production
- [ ] Test production build locally before redeploying


## 🤖 AI Model Issue

- [ ] Fix Claude model name - current model "claude-3-5-sonnet-20241022" returns 404
- [ ] Update to valid model like "claude-3-5-sonnet-20241022" or "claude-3-opus-20240229"
- [ ] Test AI content generation


## 🎨 NEW FEATURE: Modular Newsletter Sections

- [x] Update database schema - add `newsletter_sections` table
- [x] Add section types (header, content, image, cta, divider, etc.)
- [x] Add orderIndex field for drag-and-drop positioning
- [x] Create backend API for section CRUD operations
- [x] Add AI generation endpoint for individual sections
- [x] Build section editor UI with drag-and-drop (using @dnd-kit)
- [x] Add section templates (pre-designed layouts)
- [x] Update email template to render sections dynamically
- [ ] Test section reordering
- [ ] Test AI generation per section
- [ ] Test email rendering with multiple sections


## 🐛 BUG: Edition Creation Redirect

- [x] Fix edition creation redirect showing `/editions/undefined` instead of actual edition ID
- [x] Edition saves correctly but redirect URL is broken
- [x] Check edition creation mutation and router.push logic
- [x] Changed createEdition to return full edition object instead of just ID


## 📚 REBUILD: Article Library System

**Goal**: Create individual articles separately, then compose newsletters by selecting articles

### Phase 1: Article Library ✅
- [x] Change articles table to be newsletter-scoped (not edition-scoped)
- [x] Add article status (draft, published, archived)
- [x] Create edition_articles junction table
- [x] Create database functions for article library (articleLibraryDb.ts)
- [x] Create junction table functions (add/remove/reorder)
- [x] Create tRPC routes for article library
- [x] Create "Articles" page showing all articles in a library view
- [x] Add "Create Article" button with form (title, content, image, etc.)
- [x] Add "Generate with AI" for single article creation
- [x] Add article search/filter by title, category, date
- [x] Add Articles navigation link

### Phase 2: Newsletter Composer ✅
- [x] Create "Add Articles" button in edition editor
- [x] Show modal/sidebar with article library
- [x] Allow selecting multiple articles to add to edition
- [x] Add drag-and-drop to reorder selected articles
- [x] Integrated ArticleSelector component into EditionEditor

### Phase 3: AI Updates ✅
- [x] Change AI generation to create ONE article at a time
- [x] Remove "generate full newsletter" functionality
- [x] Update AI prompts for single article generation (generateSingleArticle)
- [x] Add article improvement/rewrite feature

### Phase 4: Email Rendering ✅
- [x] Update email templates to fetch articles via edition_articles
- [x] Render articles in specified order
- [x] Fixed getArticlesForEdition function usage

### Phase 5: Bug Fixes ✅
- [x] Fixed all TypeScript errors
- [x] Removed old article functions from db.ts
- [x] Updated EditionEditor to remove old article code
- [x] Fixed Analytics query to return all required fields
- [x] Fixed email.ts to use new article library functions


## ✍️ NEW FEATURE: Multi-Author System with AI Writing Styles

**Goal**: Create multiple authors with distinct writing styles that can be assigned to articles

### Phase 1: Database & Backend
- [ ] Create `authors` table (name, bio, writingStyle, tone, personality)
- [ ] Add `authorId` to articles table
- [ ] Create author CRUD database functions
- [ ] Create tRPC routes for author management

### Phase 2: Author Management UI
- [ ] Create Authors page listing all authors
- [ ] Add "Create Author" dialog with style configuration
- [ ] Add "Edit Author" dialog
- [ ] Add author deletion with confirmation

### Phase 3: Article-Author Integration
- [ ] Add author selector to article creation form
- [ ] Add author selector to AI generation dialog
- [ ] Display author name in article library
- [ ] Filter articles by author

### Phase 4: AI Style Integration
- [ ] Update generateSingleArticle to accept author style
- [ ] Inject author personality into AI prompts
- [ ] Test different writing styles (formal, casual, technical, etc.)

### Phase 5: Deployment
- [ ] Test complete author workflow
- [ ] Save checkpoint
- [ ] Push to GitHub
- [ ] Verify Railway deployment


## 🔧 URGENT: Add Navigation to Newsletters Page

**Issue**: Users stuck on /newsletters page with no way to navigate home or logout

**Goal**: Add simple header with Home button and Logout button

- [x] Add inline header to Newsletters page (no separate component to avoid complexity)
- [x] Test locally that page loads without errors
- [x] Save checkpoint and push to GitHub


## 🔧 URGENT: Fix Home Button

**Issue**: Home button doesn't go to home page - redirects back to /newsletters

**Root Cause**: Home.tsx has auto-redirect logic for logged-in users

- [x] Remove auto-redirect from Home.tsx
- [x] Test that Home button shows landing page
- [x] Push fix to GitHub


## 📝 Reduce AI Article Lengths

**Request**: Cut short, medium, long article word counts in half

- [x] Find where article lengths are defined
- [x] Reduce word counts by 50%
- [x] Test article generation
- [x] Push to GitHub


## ✍️ Update AI Writing Style

**Requirements**:
- Never use em dashes (—) in generated content
- Add checkbox to allow emojis (off by default)

- [x] Update AI prompt to ban em dashes
- [x] Add emoji checkbox to GenerateArticleDialog
- [x] Pass emoji preference to AI generation
- [x] Test article generation
- [x] Push to GitHub


## ✅ Add Article Preview & Email Preview

**Requirements**:
1. Show article excerpts in library selection so users can see content before adding
2. Add "Preview Email" button to see newsletter before sending

- [x] Add excerpt/preview to ArticleSelector component
- [x] Add email preview button to newsletter edition page
- [x] Create email preview modal/dialog
- [x] Fix email preview import (static instead of dynamic)
- [x] Test both preview features
- [x] Push to GitHub


## ✅ FIX: Email Preview Showing Blank

**Issue**: Email preview modal opens but shows blank white content

- [x] Check if getPreviewHtml query is failing
- [x] Fix function import (changed to static import)
- [x] Add error handling and loading states
- [x] Test email preview with actual content
- [x] Push fix to GitHub


## 🔧 FIX: Add Articles Button Not Working

**Issue**: Clicking "Add Articles" button does nothing - dialog doesn't open

- [ ] Check EditionEditor for article selector state/dialog
- [ ] Fix button click handler
- [ ] Test article selection flow
- [ ] Push fix to GitHub


## 🔧 URGENT: Email Preview 500 Error

**Issue**: Email preview shows loading spinner forever, console shows 500 Internal Server Error

- [x] Check generateEmailHtml function signature and parameters
- [x] Fix function call in getPreviewHtml endpoint
- [x] Add proper error logging to see exact error
- [x] Create missing getEditionArticles and getEditionSections functions
- [x] Test email preview works
- [x] Push fix to GitHub


## 🗑️ Add Delete Functionality

**Requirements**: Add ability to delete newsletters and editions with confirmation

- [x] Add delete endpoint for newsletters in backend
- [x] Add delete endpoint for editions in backend
- [x] Add delete button to newsletter cards with confirmation dialog
- [x] Add delete button to edition list with confirmation dialog
- [x] Test delete functionality
- [x] Push to GitHub


## 🎨 Fix Email Templates

**Issue**: Only Morning Brew template shows AI articles and content. Other templates (Minimalist, Bold, Magazine) don't render articles.

- [x] Investigate email template rendering code
- [x] Fix Minimalist template to show articles
- [x] Fix Bold template to show articles
- [x] Fix Magazine template to show articles
- [x] Test all templates with preview
- [x] Save checkpoint and push to GitHub


## 🎨 Template Preview Selector & Settings

**Goal**: Add template preview dropdown and template-specific settings to edition editor

### Phase 1: Database & Backend
- [x] Add `emailTemplate` field to newsletter_editions table (morning_brew, minimalist, bold, magazine) - already exists as templateStyle
- [x] Add `templateSettings` JSON field to newsletter_editions table
- [x] Update edition creation/update endpoints
- [x] Update getPreviewHtml to use selected template

### Phase 2: Template Selector UI
- [x] Add template dropdown to EditionEditor - already exists
- [x] Show template preview thumbnails/descriptions - already exists
- [x] Update email preview to use selected template - already working
- [x] Save template selection with edition - already working

### Phase 3: Template-Specific Settings
- [x] Add "Featured Article" toggle for Magazine template
- [x] Add "Show Category Badges" toggle for Morning Brew template
- [x] Add settings panel that shows/hides based on selected template
- [x] Pass settings to email template generation - templateSettings added to backend

### Phase 4: Testing & Deployment
- [x] Test all templates with preview
- [x] Test template-specific settings
- [x] Save checkpoint
- [x] Push to GitHub


## 🔙 Add Back Button to Authors Page

**Issue**: Authors page (/newsletters/:id/authors) has no back button to return to newsletter

- [x] Add back button to Authors page header
- [x] Test navigation flow
- [x] Save checkpoint

## 📅 Scheduled Send Calendar View

**Goal**: Add calendar interface showing all scheduled editions across newsletters

### Phase 1: Backend & Component
- [x] Create backend endpoint to fetch all scheduled editions
- [x] Install calendar library (react-big-calendar or similar) - used custom implementation
- [x] Create Calendar component with month/week views
- [x] Display editions on calendar with newsletter colors

### Phase 2: Navigation & Routes
- [x] Add Calendar page route
- [x] Add Calendar link to main navigation
- [x] Add click handlers to view/edit editions from calendar

### Phase 3: Testing
- [x] Test calendar with multiple scheduled editions
- [x] Test navigation from calendar to edition editor
- [x] Save checkpoint


## ✍️ Add Author Selector to AI Generation

**Issue**: When generating AI content, there's no way to select which author/persona to use

- [x] Add author dropdown to AI generation dialog
- [x] Fetch authors for current newsletter
- [x] Pass selected author to generation endpoint
- [x] Test AI generation with different authors
- [x] Save checkpoint


## 🐛 Fix Email Preview Not Showing Articles

**Issue**: Email preview shows empty content, articles not rendering in Magazine template

- [x] Check getPreviewHtml endpoint
- [x] Verify sections are being fetched correctly
- [x] Check Magazine template rendering logic - fixed to check if sections have content
- [x] Test preview with all templates
- [ ] Save checkpoint
