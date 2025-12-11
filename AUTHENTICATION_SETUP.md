# Authentication Setup Guide

This guide will help you set up Clerk authentication for the Form-to-Everything Connector project.

## Prerequisites

- A Clerk account (sign up at https://clerk.com)
- Supabase project with database access

## Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install @clerk/nextjs
```

## Step 2: Create Clerk Application

1. Go to https://clerk.com and sign in (or create an account)
2. Click "Create Application"
3. Choose your preferred authentication methods (Email, Google, GitHub, etc.)
4. Complete the setup wizard

## Step 3: Get Clerk API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy the following values:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

## Step 4: Add Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Existing environment variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SENDGRID_API_KEY=your_sendgrid_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Step 5: Update Supabase Schema

Run the SQL migration in your Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-auth-migration.sql`
4. Click **Run** to execute the migration

This will:
- Add `user_id` column to `connectors` table
- Add `user_id` column to `submissions` table
- Create indexes for better query performance
- Set up Row Level Security (RLS) policies

## Step 6: Configure Clerk Application URLs

In your Clerk dashboard:

1. Go to **Settings** → **Paths**
2. Set the following:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in URL**: `/dashboard`
   - **After sign-up URL**: `/dashboard`

## Step 7: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Dashboard" or "Get Started"
4. You should be redirected to `/sign-in`
5. Create an account or sign in
6. You should be redirected to `/dashboard`

## Features Implemented

✅ **Multi-tenant Authentication**
- Each user can only see their own connectors
- User ID is automatically added to new connectors
- Submissions are linked to connector owners

✅ **Protected Routes**
- Dashboard requires authentication
- Connector creation requires authentication
- Connector editing requires authentication

✅ **Public Webhook Endpoint**
- `/api/submit/[connectorId]` remains public
- Allows external forms to submit without authentication
- Rate limiting and validation still apply

✅ **User Interface**
- Sign-in page with Clerk components
- Sign-up page with Clerk components
- User profile button in dashboard header
- Automatic redirects for unauthenticated users

## Troubleshooting

### "Unauthorized" errors in API routes

- Make sure you're signed in
- Check that Clerk environment variables are set correctly
- Verify the middleware is working (check browser console)

### Users can see other users' connectors

- Verify RLS policies are enabled in Supabase
- Check that `user_id` column exists in `connectors` table
- Ensure API routes are filtering by `user_id`

### Webhook endpoint not working

- The `/api/submit/[connectorId]` endpoint is intentionally public
- It should work without authentication
- Check middleware configuration if issues occur

### Sign-in redirects not working

- Verify Clerk application URLs are configured correctly
- Check that `afterSignInUrl` and `afterSignUpUrl` are set
- Ensure routes exist in your application

## Security Notes

1. **Never commit `.env.local`** - It contains sensitive keys
2. **Use environment-specific keys** - Different keys for dev/staging/production
3. **RLS Policies** - Ensure Row Level Security is enabled in Supabase
4. **Webhook Security** - The public webhook endpoint uses rate limiting and validation

## Next Steps

After authentication is set up, you can:
- Create connectors (they'll be automatically linked to your user)
- View only your own connectors in the dashboard
- Edit and delete your connectors
- View submission history (coming in Feature 4)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for API errors
3. Verify all environment variables are set
4. Ensure Supabase migration was run successfully





