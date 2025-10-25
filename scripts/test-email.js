#!/usr/bin/env node

/**
 * Email Functionality Test Script
 * Tests SMTP connection and sends a test email
 */

require('dotenv').config()
const nodemailer = require('nodemailer')
const readline = require('readline')

// ANSI color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(80))
  log(title, 'bright')
  console.log('='.repeat(80))
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green')
}

function logError(message) {
  log(`✗ ${message}`, 'red')
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan')
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow')
}

// Get email input from user
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  )
}

async function testEmailConfiguration() {
  logSection('📧 SMTP Email Configuration Test')

  // Check environment variables
  log('\n1. Checking Environment Variables...', 'cyan')
  
  const requiredVars = [
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_PORT',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
    'EMAIL_FROM',
  ]

  let missingVars = []
  const config = {}

  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      logSuccess(`${varName} = ${varName.includes('PASSWORD') ? '********' : process.env[varName]}`)
      config[varName] = process.env[varName]
    } else {
      logError(`${varName} is not set`)
      missingVars.push(varName)
    }
  })

  if (missingVars.length > 0) {
    logError('\nMissing required environment variables!')
    logInfo('Please add these to your .env file:')
    missingVars.forEach((varName) => {
      console.log(`  ${varName}=your_value`)
    })
    process.exit(1)
  }

  // Create transporter
  log('\n2. Creating SMTP Transporter...', 'cyan')
  
  const transportConfig = {
    host: config.EMAIL_SERVER_HOST,
    port: Number(config.EMAIL_SERVER_PORT),
    secure: true, // SSL/TLS
    auth: {
      user: config.EMAIL_SERVER_USER,
      pass: config.EMAIL_SERVER_PASSWORD,
    },
  }

  logInfo(`Host: ${transportConfig.host}`)
  logInfo(`Port: ${transportConfig.port}`)
  logInfo(`Secure: ${transportConfig.secure}`)
  logInfo(`User: ${transportConfig.auth.user}`)

  const transporter = nodemailer.createTransport(transportConfig)
  logSuccess('Transporter created successfully')

  // Verify SMTP connection
  log('\n3. Testing SMTP Connection...', 'cyan')
  
  try {
    await transporter.verify()
    logSuccess('SMTP connection successful!')
    logSuccess(`Connected to ${config.EMAIL_SERVER_HOST}:${config.EMAIL_SERVER_PORT}`)
  } catch (error) {
    logError('SMTP connection failed!')
    logError(`Error: ${error.message}`)
    logWarning('\nPossible causes:')
    console.log('  • Incorrect credentials')
    console.log('  • Firewall blocking port 465')
    console.log('  • SMTP server is down')
    console.log('  • Network connectivity issues')
    process.exit(1)
  }

  // Ask for test email recipient
  log('\n4. Sending Test Email...', 'cyan')
  
  const testEmail = await askQuestion(
    `${colors.yellow}Enter recipient email address (or press Enter to use ${config.EMAIL_SERVER_USER}): ${colors.reset}`
  )
  
  const recipientEmail = testEmail.trim() || config.EMAIL_SERVER_USER

  logInfo(`Sending test email to: ${recipientEmail}`)

  // Send test email
  const mailOptions = {
    from: config.EMAIL_FROM,
    to: recipientEmail,
    subject: '✅ Epsol Index Checker - Email Test Successful',
    text: `
This is a test email from Epsol Index Checker.

If you're reading this, your email configuration is working correctly!

Configuration Details:
- SMTP Server: ${config.EMAIL_SERVER_HOST}
- SMTP Port: ${config.EMAIL_SERVER_PORT}
- From Address: ${config.EMAIL_FROM}
- Sent At: ${new Date().toLocaleString()}

Next Steps:
1. Your email system is ready to send magic links
2. Users can now sign up and sign in
3. Check the SMTP_SETUP.md file for more information

--
Epsol Index Checker
Automated Email Test
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
      <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px;">
        Congratulations! Your email configuration is working correctly.
      </p>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0070f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #0070f3; font-weight: bold;">✓ SMTP Connection Verified</p>
      </div>
      
      <h2 style="color: #333; font-size: 18px; margin-top: 30px;">Configuration Details:</h2>
      <table style="width: 100%; font-size: 14px; margin: 10px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">SMTP Server:</td>
          <td style="padding: 8px 0; color: #333;">${config.EMAIL_SERVER_HOST}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">SMTP Port:</td>
          <td style="padding: 8px 0; color: #333;">${config.EMAIL_SERVER_PORT} (SSL/TLS)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">From Address:</td>
          <td style="padding: 8px 0; color: #333;">${config.EMAIL_FROM}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Sent At:</td>
          <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <h2 style="color: #333; font-size: 18px; margin-top: 30px;">Next Steps:</h2>
      <ul style="font-size: 14px; line-height: 1.8; color: #333;">
        <li>✅ Your email system is ready to send magic links</li>
        <li>✅ Users can now sign up and sign in</li>
        <li>✅ Check the <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">SMTP_SETUP.md</code> file for more information</li>
      </ul>
      
      <div style="margin-top: 40px; padding: 20px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #666; text-align: center;">
          <strong>Epsol Index Checker</strong><br>
          Automated Email Test · ${new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    logSuccess('Test email sent successfully!')
    logSuccess(`Message ID: ${info.messageId}`)
    logInfo(`Email sent to: ${recipientEmail}`)
    
    logSection('🎉 All Tests Passed!')
    console.log('\n✅ Email configuration is working correctly')
    console.log('✅ SMTP connection verified')
    console.log('✅ Test email delivered\n')
    
    logInfo('Check your inbox to confirm email receipt')
    logInfo('The application is ready to send authentication emails')
    
  } catch (error) {
    logError('Failed to send test email!')
    logError(`Error: ${error.message}`)
    
    if (error.responseCode) {
      logWarning(`\nSMTP Response Code: ${error.responseCode}`)
    }
    
    logWarning('\nPossible causes:')
    console.log('  • Invalid sender email address')
    console.log('  • Recipient email address rejected')
    console.log('  • SMTP server quota exceeded')
    console.log('  • Temporary server issue')
    
    process.exit(1)
  }
}

// Main execution
async function main() {
  try {
    await testEmailConfiguration()
  } catch (error) {
    logError('\nUnexpected error occurred!')
    logError(error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the test
main()
