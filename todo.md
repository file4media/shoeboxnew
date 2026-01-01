# Newsletter Platform TODO

## Database Schema & Models
- [x] Design and implement newsletters table (id, userId, name, description, fromName, fromEmail, subject, branding, createdAt, updatedAt)
- [x] Design and implement subscribers table (id, email, name, status, createdAt, updatedAt)
- [x] Design and implement newsletter_subscribers junction table (newsletterId, subscriberId, status, subscribedAt)
- [x] Design and implement newsletter_editions table (id, newsletterId, subject, content, htmlContent, status, scheduledAt, sentAt, createdAt)
- [x] Design and implement email_tracking table (id, editionId, subscriberId, openedAt, ipAddress, userAgent)
- [x] Create database helper functions for all tables

## Backend API Development
- [x] Build newsletter CRUD endpoints (create, read, update, delete, list)
- [x] Build subscriber management endpoints (add, remove, import, export)
- [x] Build newsletter edition endpoints (create, update, send, schedule)
- [x] Build tracking pixel endpoint for email opens
- [x] Build analytics endpoints (open rates, subscriber growth, engagement stats)

## Email Integration
- [x] Install and configure Resend SDK
- [ ] Request Resend API key from user (user will add later)
- [x] Implement email sending function with Resend
- [x] Add tracking pixel generation and embedding in emails
- [ ] Test email delivery and tracking

## AI Content Generation
- [x] Implement AI content generation using built-in LLM
- [x] Create newsletter content templates and prompts
- [x] Add content generation endpoint with customizable parameters
- [ ] Test AI-generated content quality

## Image Integration
- [x] Install and configure Unsplash SDK
- [ ] Request Unsplash API key from user (user will add later)
- [x] Implement image search and selection
- [x] Add image embedding in newsletter editor
- [ ] Test image integration

## Frontend Development
- [x] Design color scheme and typography
- [x] Create newsletter dashboard layout
- [x] Build newsletter list view with create/edit/delete actions
- [x] Build newsletter editor with rich text capabilities
- [x] Build AI content generation UI with prompt input
- [x] Build image browser with Unsplash integration
- [x] Build subscriber management interface
- [x] Build email preview functionality
- [x] Build send/schedule interface
- [x] Create analytics dashboard with charts
- [x] Add subscriber growth visualization
- [x] Add open rate tracking visualization

## Testing
- [x] Write unit tests for newsletter CRUD operations
- [x] Write unit tests for subscriber management
- [ ] Write unit tests for email sending (requires API keys)
- [ ] Write unit tests for tracking pixel functionality
- [ ] Write unit tests for analytics calculations
- [x] Test complete user workflow end-to-end

## Deployment Preparation
- [x] Create comprehensive README with setup instructions
- [x] Document environment variables needed
- [x] Create Railway deployment configuration
- [x] Document GitHub repository setup process
- [ ] Test deployment process (requires user to deploy)

## Card-Based Article System Refactor
- [x] Create articles table (id, editionId, category, title, content, excerpt, imageUrl, order, slug, createdAt)
- [x] Add scheduledFor field to newsletter_editions table
- [x] Update edition to support multiple articles instead of single content block
- [x] Build article CRUD endpoints (create, update, delete, reorder)
- [x] Build article management UI with card-based editor
- [x] Create Morning Brew-style email template with article cards
- [x] Implement 500-600 word truncation for email previews
- [x] Create public frontend routes for full article display (/newsletter/:slug/article/:articleSlug)
- [ ] Add scheduling system for editions (cron job or manual trigger)
- [x] Design email footer with social links and unsubscribe
- [x] Test complete article workflow (create, email, view on site)

## Welcome Email System
- [x] Add welcomeEmailSubject and welcomeEmailContent fields to newsletters table
- [x] Create welcome email template with newsletter branding
- [x] Trigger welcome email when subscriber joins a newsletter
- [x] Add welcome email editor in newsletter settings
- [x] Test welcome email delivery

## Drag-and-Drop Reordering
- [x] Install @dnd-kit/core and @dnd-kit/sortable packages
- [x] Implement drag-and-drop for article cards in EditionEditor
- [x] Add visual feedback during drag operations
- [x] Update article order on drop
- [x] Test drag-and-drop functionality

## Email Template Library
- [x] Create template system with multiple styles (Morning Brew, Minimalist, Bold, Magazine)
- [x] Add templateStyle field to newsletter_editions table
- [x] Build template selector UI in edition editor
- [x] Implement Minimalist template (clean, simple design)
- [x] Implement Bold template (vibrant colors, large typography)
- [x] Implement Magazine template (multi-column, editorial style)
- [x] Update email generation to use selected template
- [ ] Add template preview functionality

## Automated Scheduling System
- [x] Create scheduled_jobs table for tracking scheduled sends
- [x] Build background job processor for scheduled editions
- [x] Implement cron-style scheduler that checks for pending sends
- [x] Add job status tracking (pending, processing, completed, failed)
- [x] Add retry logic for failed sends
- [ ] Create admin UI for viewing scheduled jobs
- [x] Test automated scheduling end-to-end
