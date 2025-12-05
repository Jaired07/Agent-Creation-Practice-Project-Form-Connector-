# Form Connector - Admin Dashboard

A Next.js 14 admin dashboard for managing form connectors that route submissions to multiple destinations.

## Features

- 📊 **Dashboard** - View all connectors with statistics
- ➕ **Create Connectors** - Multi-step form to create new connectors
- 🔗 **Webhook URLs** - Auto-generated unique webhook URLs for each connector
- 🎯 **Multiple Destinations** - Support for Email, Sheets, Slack, SMS, and Webhook destinations
- 🎨 **Modern UI** - Clean, professional design with Tailwind CSS

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Get your project URL and anon key from the Supabase dashboard

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main dashboard page
│   ├── connectors/
│   │   └── new/           # Create new connector page
│   ├── api/
│   │   └── connectors/    # API routes for CRUD operations
│   └── page.js            # Home page
├── components/
│   ├── ConnectorCard.js   # Connector display card
│   └── DestinationCard.js # Destination selection card
└── lib/
    └── supabase.js        # Supabase client configuration
```

## Pages

### `/dashboard`
Main dashboard showing:
- Total connectors count
- Total submissions count
- Active destinations count
- List of all connectors with edit buttons

### `/connectors/new`
Multi-step form to create a new connector:
1. **Step 1**: Name and description
2. **Step 2**: Select destinations (Email, Sheets, Slack, SMS, Webhook)
3. **Step 3**: Success page with generated webhook URL

## API Routes

### `GET /api/connectors`
Get all connectors

### `POST /api/connectors`
Create a new connector

### `GET /api/connectors/[id]`
Get a single connector

### `PUT /api/connectors/[id]`
Update a connector

### `DELETE /api/connectors/[id]`
Delete a connector

## Database Schema

The `connectors` table includes:
- `id` - UUID primary key
- `name` - Connector name
- `description` - Optional description
- `webhook_url` - Generated webhook URL
- `webhook_id` - Unique webhook identifier
- `destinations` - JSONB array of selected destinations
- `submission_count` - Counter for submissions
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Next Steps

- [ ] Add authentication
- [ ] Implement destination integrations (Email, Sheets, Slack, SMS)
- [ ] Add webhook endpoint to receive form submissions
- [ ] Add edit connector functionality
- [ ] Add submission history/logs
- [ ] Add analytics and reporting

## Tech Stack

- **Next.js 14** - React framework
- **Supabase** - Database and backend
- **Tailwind CSS** - Styling
- **React** - UI library
