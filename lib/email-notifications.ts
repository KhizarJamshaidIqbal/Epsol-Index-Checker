/**
 * Email notification utilities
 */

interface CustomJobEmailParams {
  to: string
  jobName: string
  campaignName: string
  campaignId: string
  urlsChecked: number
  frequency: string
}

const FREQUENCY_LABELS: Record<string, string> = {
  HOURLY: 'Every Hour',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
}

/**
 * Send custom job completion email
 */
export async function sendCustomJobEmail(params: CustomJobEmailParams): Promise<void> {
  const { to, jobName, campaignName, campaignId, urlsChecked, frequency } = params

  // Check if email is configured
  if (!process.env.EMAIL_SERVER_HOST) {
    console.log('Email not configured, skipping notification')
    return
  }

  try {
    const nodemailer = await import('nodemailer')

    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: true, // SSL/TLS
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const campaignUrl = `${appUrl}/campaigns/${campaignId}`

    await transport.sendMail({
      to,
      from: process.env.EMAIL_FROM,
      subject: `✅ Custom Job "${jobName}" Completed - ${campaignName}`,
      text: `
Custom Job Completed Successfully

Job: ${jobName}
Campaign: ${campaignName}
Frequency: ${FREQUENCY_LABELS[frequency] || frequency}

Summary:
- ${urlsChecked} URLs have been rechecked
- Results will be available shortly in your dashboard

View Campaign: ${campaignUrl}

--
Epsol Index Checker
Automated Custom Job Notification
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0070f3 0%, #00a0ff 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">✅ Custom Job Completed</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <div style="margin-bottom: 30px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px;">
          Your custom job <strong>"${jobName}"</strong> has completed successfully.
        </p>
      </div>

      <div style="background-color: #f0f9ff; border-left: 4px solid #0070f3; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Campaign:</td>
            <td style="padding: 8px 0; color: #333;">${campaignName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Schedule:</td>
            <td style="padding: 8px 0; color: #333;">${FREQUENCY_LABELS[frequency] || frequency}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">URLs Rechecked:</td>
            <td style="padding: 8px 0; color: #333;"><strong>${urlsChecked}</strong></td>
          </tr>
        </table>
      </div>

      <div style="margin: 30px 0;">
        <a href="${campaignUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 14px 32px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Campaign Results
        </a>
      </div>

      <div style="margin-top: 40px; padding: 20px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #666;">
          <strong>📊 What happens next?</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #666; line-height: 1.6;">
          <li>Results will be processed in the background</li>
          <li>Check your dashboard for updated index status</li>
          <li>This job will run again based on your schedule</li>
        </ul>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #999;">
          <strong>Epsol Index Checker</strong><br>
          Automated Custom Job Notification
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim(),
    })

    console.log(`Custom job email sent to ${to}`)
  } catch (error) {
    console.error('Error sending custom job email:', error)
    // Don't throw error - email failure shouldn't stop the job
  }
}
