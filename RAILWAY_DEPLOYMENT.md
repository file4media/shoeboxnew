# Railway Deployment Guide for ShoeboxNews

This guide will help you deploy your newsletter platform to Railway with a custom domain.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub account with your code repository
- Resend API key (get from [resend.com](https://resend.com))
- Unsplash API key (get from [unsplash.com/developers](https://unsplash.com/developers))
- Anthropic Claude API key (get from [console.anthropic.com](https://console.anthropic.com))

## Step 1: Create New Project in Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `file4media/shoeboxnew` repository
5. Railway will automatically detect it's a Node.js project

## Step 2: Add MySQL Database

1. In your Railway project, click "New Service"
2. Select "Database" → "MySQL"
3. Railway will automatically create the database and generate connection variables

## Step 3: Configure Environment Variables

Click on your web service (shoeboxnew), go to the "Variables" tab, and add these variables:

### Required Variables

```
DATABASE_URL=${{MySQL.MYSQL_URL}}
RESEND_API_KEY=your_resend_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
JWT_SECRET=your_random_secret_string_here
NODE_ENV=production
```

### Generate JWT_SECRET

Run this command to generate a secure random string:
```bash
openssl rand -base64 32
```

Or use this online: https://generate-secret.vercel.app/32

## Step 4: Configure Build Settings

Railway should auto-detect these, but verify:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Root Directory**: `/` (leave empty)

## Step 5: Deploy

1. Click "Deploy" in Railway
2. Wait for the build to complete (usually 2-3 minutes)
3. Railway will provide a temporary URL like `shoeboxnew-production.up.railway.app`

## Step 6: Add Custom Domain

1. In Railway, go to your service's "Settings" tab
2. Scroll to "Domains" section
3. Click "Add Domain"
4. Enter `shoeboxnews.com`
5. Railway will provide DNS records to add

### DNS Configuration

Add these records to your domain registrar (where you bought shoeboxnews.com):

**For root domain (shoeboxnews.com):**
- Type: `A`
- Name: `@`
- Value: (Railway will provide the IP)

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: (Railway will provide the target)

Wait 5-60 minutes for DNS propagation.

## Step 7: Configure Resend Domain

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `shoeboxnews.com`
4. Add the DNS records Resend provides to your domain registrar:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)

Once verified, you can send emails from any address @shoeboxnews.com!

## Step 8: Create Your First Account

1. Visit `https://shoeboxnews.com/login`
2. Click "Create one" to register
3. Enter your email and password
4. You're in! Start creating newsletters

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | Auto-set by Railway |
| `RESEND_API_KEY` | Resend API key for sending emails | `re_...` |
| `UNSPLASH_ACCESS_KEY` | Unsplash API key for images | `...` |
| `ANTHROPIC_API_KEY` | Claude API key for AI content | `sk-ant-...` |
| `JWT_SECRET` | Secret for session tokens | Random 32+ char string |
| `NODE_ENV` | Environment mode | `production` |

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (v22+)
- Check build logs for specific errors

### Database Connection Fails
- Verify `DATABASE_URL` is set to `${{MySQL.MYSQL_URL}}`
- Ensure MySQL service is running
- Check database connection logs

### Application Crashes
- Check application logs in Railway dashboard
- Verify all environment variables are set correctly
- Ensure JWT_SECRET is set

### Emails Not Sending
- Verify Resend domain is verified
- Check RESEND_API_KEY is correct
- Ensure DNS records are properly configured

## Cost Estimate

**Railway Pricing:**
- Hobby Plan: $5/month (includes $5 credit)
- MySQL: ~$5-10/month depending on usage
- **Total**: ~$5-10/month for small to medium newsletters

**External Services:**
- Resend: Free for 3,000 emails/month, then $20/month for 50k
- Anthropic Claude: Pay-as-you-go (~$0.03-0.05 per article)
- Unsplash: Free for 50 requests/hour

## Support

For issues specific to:
- **Railway deployment**: Check [railway.app/help](https://railway.app/help)
- **Resend emails**: Check [resend.com/docs](https://resend.com/docs)
- **Claude API**: Check [docs.anthropic.com](https://docs.anthropic.com)

## Next Steps

After deployment:
1. Create your first newsletter
2. Add subscribers
3. Generate AI content
4. Send your first edition!

Enjoy your newsletter platform! 🎉
