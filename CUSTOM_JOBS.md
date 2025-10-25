# Custom Jobs Feature Documentation

## Overview

The Custom Jobs feature allows users to schedule automated URL rechecks for their campaigns. Jobs can run hourly, daily, weekly, or monthly and send email notifications when complete.

## Features

✅ **Scheduled Rechecks** - Automatically recheck URLs at configured intervals  
✅ **Email Notifications** - Receive detailed results via email  
✅ **Multiple Frequencies** - Hourly, Daily, Weekly, or Monthly schedules  
✅ **Job Management** - Pause, resume, or delete custom jobs  
✅ **Modern UI** - Beautiful interface for creating and managing jobs

## Database Setup

### 1. Run Migration

After pulling the code, run the Prisma migration:

```bash
npx prisma migrate dev --name add_custom_jobs
```

Or if you're using an existing database:

```bash
npx prisma db push
```

### 2. Verify Schema

The migration adds the `CustomJob` table with these fields:
- `id` - Unique identifier
- `campaignId` - Associated campaign
- `userId` - Job owner
- `name` - Job name
- `frequency` - HOURLY, DAILY, WEEKLY, or MONTHLY
- `isActive` - Job status (active/paused)
- `emailOnComplete` - Send email when done
- `lastRunAt` - Last execution time
- `nextRunAt` - Next scheduled execution
- `createdAt` / `updatedAt` - Timestamps

## Setup Cron Job

Custom jobs need a cron job to trigger them. Choose one of these options:

### Option 1: Node.js Cron (Recommended for Development)

Install node-cron:
```bash
npm install node-cron @types/node-cron
```

Create `scripts/cron.js`:
```javascript
const cron = require('node-cron');
const fetch = require('node-fetch');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running custom jobs...');
  try {
    const res = await fetch('http://localhost:3000/api/cron/run-custom-jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
      },
    });
    const data = await res.json();
    console.log('Jobs completed:', data);
  } catch (error) {
    console.error('Error running jobs:', error);
  }
});

console.log('Cron scheduler started');
```

Run it:
```bash
node scripts/cron.js
```

### Option 2: System Cron (Linux/Mac)

Add to your crontab (`crontab -e`):

```bash
# Run every hour
0 * * * * curl -X POST http://localhost:3000/api/cron/run-custom-jobs -H "Authorization: Bearer YOUR_SECRET"
```

### Option 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to run hourly
4. Set action to run PowerShell:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/cron/run-custom-jobs" -Method POST -Headers @{Authorization="Bearer YOUR_SECRET"}
   ```

### Option 4: Vercel Cron (Production)

In `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/run-custom-jobs",
    "schedule": "0 * * * *"
  }]
}
```

### Option 5: GitHub Actions (Free)

Create `.github/workflows/cron.yml`:
```yaml
name: Run Custom Jobs
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  run-jobs:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Custom Jobs
        run: |
          curl -X POST https://your-domain.com/api/cron/run-custom-jobs \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Security

### Set CRON_SECRET

Add to your `.env`:
```env
CRON_SECRET=your-random-secret-key-here
```

Generate a secure secret:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use a password generator
```

The cron endpoint requires this secret in the Authorization header.

## User Interface

### Creating a Custom Job

1. Go to any campaign detail page
2. Click **"Custom Jobs"** button (left of Analytics)
3. Click **"Create New Custom Job"**
4. Fill in:
   - **Job Name**: Descriptive name (e.g., "Daily Index Check")
   - **Frequency**: Hourly, Daily, Weekly, or Monthly
   - **Email Notifications**: Toggle on/off
5. Click **"Create Job"**

### Managing Jobs

- **Pause/Resume**: Click the power icon
- **Delete**: Click the trash icon
- **View Details**: See last run and next run times
- **Email Status**: Check if notifications are enabled

## Email Notifications

When a job completes, users receive an email with:
- Job name and campaign name
- Number of URLs rechecked
- Schedule frequency
- Direct link to view results

Example email subject:
```
✅ Custom Job "Daily Index Check" Completed - Dream Land Tourism
```

## API Endpoints

### List Custom Jobs
```http
GET /api/campaigns/:id/custom-jobs
```

### Create Custom Job
```http
POST /api/campaigns/:id/custom-jobs
Content-Type: application/json

{
  "name": "Daily Index Check",
  "frequency": "DAILY",
  "emailOnComplete": true
}
```

### Update Job Status
```http
PATCH /api/campaigns/:id/custom-jobs/:jobId
Content-Type: application/json

{
  "isActive": false
}
```

### Delete Custom Job
```http
DELETE /api/campaigns/:id/custom-jobs/:jobId
```

### Run Jobs (Cron Endpoint)
```http
POST /api/cron/run-custom-jobs
Authorization: Bearer YOUR_CRON_SECRET
```

## How It Works

1. **User creates job** → Job stored in database with `nextRunAt` timestamp
2. **Cron triggers hourly** → Calls `/api/cron/run-custom-jobs`
3. **System finds due jobs** → Queries jobs where `nextRunAt <= now` and `isActive = true`
4. **Execute each job**:
   - Find URLs needing recheck (NOT_INDEXED, ERROR, NOT_FETCHED)
   - Enqueue URLs to check queue
   - Update `lastRunAt` and calculate new `nextRunAt`
5. **Send email** → If `emailOnComplete = true`, send notification
6. **Process queue** → Background workers process URLs
7. **Results available** → User sees updated status in dashboard

## Frequency Details

| Frequency | Runs Every | Example Schedule |
|-----------|-----------|------------------|
| **HOURLY** | 1 hour | 1:00 PM, 2:00 PM, 3:00 PM... |
| **DAILY** | 24 hours | Every day at creation time |
| **WEEKLY** | 7 days | Same day/time each week |
| **MONTHLY** | 1 month | Same date each month |

## Troubleshooting

### Jobs Not Running

1. **Check cron is running**
   ```bash
   # If using node-cron
   ps aux | grep cron.js
   ```

2. **Test endpoint manually**
   ```bash
   curl -X POST http://localhost:3000/api/cron/run-custom-jobs \
     -H "Authorization: Bearer YOUR_SECRET"
   ```

3. **Check logs**
   - Server logs show job execution
   - Email errors are logged but don't stop jobs

### Email Not Sending

1. Verify SMTP credentials in `.env`:
   ```env
   EMAIL_SERVER_HOST=epsoldev.com
   EMAIL_SERVER_PORT=465
   EMAIL_SERVER_USER=epsolindexchecker@epsoldev.com
   EMAIL_SERVER_PASSWORD=JinnahEnt786
   EMAIL_FROM=epsolindexchecker@epsoldev.com
   ```

2. Test email with:
   ```bash
   npm run test:email
   ```

### Jobs Stuck in "Running"

- Campaign status may not reset if URLs take long to process
- Check queue worker is running
- Manually reset campaign status if needed

## Performance Considerations

- **Hourly jobs**: Use sparingly for large campaigns
- **Email delivery**: Asynchronous, doesn't block job execution
- **Queue system**: Uses Redis if available, falls back to in-process
- **Concurrent jobs**: All due jobs run in parallel

## Best Practices

1. **Use descriptive names**: "Weekly SEO Check" not "Job 1"
2. **Start with Daily**: Test before increasing frequency
3. **Enable email**: Know when jobs complete
4. **Monitor first runs**: Check logs for any issues
5. **Pause unused jobs**: Don't delete them permanently

## Example Use Cases

- **Daily SEO Monitoring**: Check critical pages daily
- **Weekly Content Audit**: Verify new content indexing weekly
- **Hourly Urgent**: Monitor important pages after publication
- **Monthly Reports**: Full site audit once per month

---

**Need Help?** Check the main SETUP.md or SMTP_SETUP.md files for more information.
