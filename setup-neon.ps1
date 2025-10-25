# Setup Neon Database Script
# This script updates your .env file to use Neon and pushes the schema

Write-Host "🔧 Setting up Neon Database..." -ForegroundColor Cyan
Write-Host ""

# Neon connection string
$NEON_URL = "postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Read .env file
$envPath = ".env"
$envExamplePath = ".env.example"

# Check if .env exists
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item $envExamplePath $envPath
}

# Read the current .env content
$envContent = Get-Content $envPath -Raw

# Replace DATABASE_URL
if ($envContent -match 'DATABASE_URL=.*') {
    $newContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=$NEON_URL"
    Set-Content -Path $envPath -Value $newContent -NoNewline
    Write-Host "✅ Updated DATABASE_URL in .env to use Neon" -ForegroundColor Green
} else {
    # Add DATABASE_URL if it doesn't exist
    Add-Content -Path $envPath -Value "`nDATABASE_URL=$NEON_URL"
    Write-Host "✅ Added DATABASE_URL to .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "📤 Pushing schema to Neon..." -ForegroundColor Cyan
Write-Host ""

# Push schema to Neon
npx prisma db push

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Refresh the Neon extension in VS Code" -ForegroundColor White
Write-Host "2. Click 'Connect' in the Neon extension panel" -ForegroundColor White
Write-Host "3. You should see all your tables!" -ForegroundColor White
Write-Host ""
Write-Host "Tables you should see:" -ForegroundColor Cyan
Write-Host "  • User" -ForegroundColor White
Write-Host "  • Campaign" -ForegroundColor White
Write-Host "  • UrlItem" -ForegroundColor White
Write-Host "  • Setting" -ForegroundColor White
Write-Host "  • Account" -ForegroundColor White
Write-Host "  • Session" -ForegroundColor White
Write-Host "  • VerificationToken" -ForegroundColor White
