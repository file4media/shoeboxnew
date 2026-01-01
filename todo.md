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
