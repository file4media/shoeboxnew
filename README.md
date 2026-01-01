# Newsletter Platform

A modern, AI-powered newsletter management platform built with React, Express, tRPC, and Tailwind CSS. Create and manage multiple newsletters, generate content with AI, send emails via Resend, and track engagement with built-in analytics.

## Features

### Core Functionality
- **Multi-Newsletter Management**: Create and manage multiple newsletters with separate configurations
- **AI Content Generation**: Generate newsletter content using built-in LLM with customizable tone and length
- **Email Delivery**: Send newsletters via Resend API with reliable delivery
- **Subscriber Management**: Add, organize, and manage subscribers for each newsletter
- **Email Open Tracking**: Track email opens using invisible tracking pixels
- **Analytics Dashboard**: View open rates, subscriber growth, and engagement metrics
- **Image Integration**: Search and insert images from Unsplash API

### Technical Features
- **Type-Safe API**: End-to-end type safety with tRPC
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS 4 and shadcn/ui
- **Real-Time Updates**: Optimistic UI updates for instant feedback
- **Authentication**: Secure authentication with Manus OAuth
- **Database**: MySQL/TiDB with Drizzle ORM
- **Testing**: Comprehensive unit tests with Vitest

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui, Wouter (routing)
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL/TiDB with Drizzle ORM
- **Email**: Resend API
- **AI**: Built-in LLM integration
- **Images**: Unsplash API
- **Testing**: Vitest
- **Deployment**: Railway (recommended)

## Prerequisites

- Node.js 22.x or higher
- pnpm 10.x or higher
- MySQL/TiDB database
- Resend API key
- Unsplash Access Key (optional, for image search)

## Environment Variables

The following environment variables are required:

### System Variables (Auto-configured in Manus)
- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session cookie signing secret
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth backend URL
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL
- `OWNER_OPEN_ID`, `OWNER_NAME` - Owner information
- `BUILT_IN_FORGE_API_URL` - Manus built-in APIs URL
- `BUILT_IN_FORGE_API_KEY` - Manus built-in APIs key (server-side)
- `VITE_FRONTEND_FORGE_API_KEY` - Manus built-in APIs key (frontend)
- `VITE_FRONTEND_FORGE_API_URL` - Manus built-in APIs URL (frontend)

### Required API Keys
- `RESEND_API_KEY` - Your Resend API key for sending emails
- `UNSPLASH_ACCESS_KEY` - Your Unsplash Access Key for image search (optional)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd newsletter-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   If deploying to Manus, most system variables are auto-configured. You only need to add:
   - `RESEND_API_KEY` - Get from [Resend](https://resend.com)
   - `UNSPLASH_ACCESS_KEY` - Get from [Unsplash Developers](https://unsplash.com/developers)

4. **Push database schema**
   ```bash
   pnpm db:push
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run unit tests
- `pnpm db:push` - Push database schema changes
- `pnpm check` - Type check without emitting
- `pnpm format` - Format code with Prettier

### Project Structure

```
newsletter-platform/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable UI components
│       ├── lib/           # Utilities and tRPC client
│       └── App.tsx        # Main app component with routing
├── server/                # Backend Express + tRPC server
│   ├── _core/            # Core server infrastructure
│   ├── db.ts             # Database query helpers
│   ├── routers.ts        # tRPC API routes
│   ├── email.ts          # Email service (Resend)
│   ├── aiContent.ts      # AI content generation
│   └── unsplashService.ts # Unsplash image service
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Database table definitions
└── shared/               # Shared types and constants
```

### Adding New Features

1. **Database Changes**
   - Update schema in `drizzle/schema.ts`
   - Run `pnpm db:push` to apply changes
   - Add query helpers in `server/db.ts`

2. **Backend API**
   - Add procedures in `server/routers.ts`
   - Use `protectedProcedure` for authenticated routes
   - Use `publicProcedure` for public routes

3. **Frontend**
   - Create page components in `client/src/pages/`
   - Add routes in `client/src/App.tsx`
   - Use `trpc.*.useQuery/useMutation` hooks

4. **Testing**
   - Write tests in `server/*.test.ts`
   - Run `pnpm test` to verify

## Deployment

### Deploying to Railway

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create Railway Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add MySQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "Add MySQL"
   - Railway will automatically inject `DATABASE_URL`

4. **Configure Environment Variables**
   
   In Railway's service settings, add these variables:
   ```
   RESEND_API_KEY=your_resend_api_key
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   JWT_SECRET=your_random_secret_string
   NODE_ENV=production
   ```

5. **Configure Build Settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Root Directory: `/` (if package.json is in root)

6. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Access your app via the generated Railway URL

### Environment-Specific Configuration

For Railway deployment, ensure:
- `PORT` environment variable is used (Railway provides this automatically)
- Database connection uses `DATABASE_URL` from environment
- All API keys are set in Railway's environment variables

## API Keys Setup

### Resend API Key
1. Sign up at [Resend](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Add to environment as `RESEND_API_KEY`

### Unsplash Access Key
1. Sign up at [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Copy the Access Key
4. Add to environment as `UNSPLASH_ACCESS_KEY`

## Usage

### Creating a Newsletter

1. Log in to the platform
2. Click "Create Newsletter"
3. Fill in newsletter details (name, from email, etc.)
4. Click "Create"

### Creating an Edition

1. Navigate to your newsletter
2. Click "Create Edition"
3. Enter subject line
4. Use AI to generate content or write manually
5. Add images from Unsplash
6. Preview and send

### Managing Subscribers

1. Navigate to your newsletter
2. Click "Subscribers"
3. Add subscribers manually or import from CSV
4. View subscriber status and engagement

### Viewing Analytics

1. Navigate to your newsletter
2. Click "Analytics"
3. View open rates, subscriber growth, and edition performance

## Testing

Run the test suite:

```bash
pnpm test
```

Tests cover:
- Newsletter CRUD operations
- Subscriber management
- Edition creation and updates
- Authentication flows

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Ensure database is accessible from your deployment environment
- Check database credentials and permissions

### Email Sending Fails
- Verify `RESEND_API_KEY` is valid
- Check Resend dashboard for sending limits
- Ensure "from" email is verified in Resend

### Image Search Not Working
- Verify `UNSPLASH_ACCESS_KEY` is set
- Check Unsplash API rate limits
- Ensure API key has proper permissions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own newsletters!

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Railway deployment logs for errors

## Roadmap

- [ ] Email template customization
- [ ] Scheduled sending
- [ ] A/B testing for subject lines
- [ ] Advanced analytics and reporting
- [ ] Subscriber segmentation
- [ ] Webhook integrations
- [ ] CSV import/export for subscribers
- [ ] Email preview in multiple clients

---

Built with ❤️ using React, tRPC, and Tailwind CSS
