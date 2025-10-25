# Fix all API routes that use requireAuth by adding dynamic = 'force-dynamic'

$routes = @(
    "app\api\campaigns\[id]\route.ts",
    "app\api\campaigns\[id]\items\route.ts",
    "app\api\campaigns\[id]\items\delete\route.ts",
    "app\api\campaigns\[id]\recheck\route.ts",
    "app\api\campaigns\[id]\custom-jobs\route.ts",
    "app\api\campaigns\[id]\custom-jobs\[jobId]\route.ts",
    "app\api\database\[tableName]\route.ts",
    "app\api\export\[campaignId]\route.ts"
)

$dynamicDirective = @"
// Force dynamic rendering - this route uses authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

"@

foreach ($route in $routes) {
    $filePath = Join-Path $PSScriptRoot $route
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Check if already has dynamic directive
        if ($content -notmatch "export const dynamic") {
            Write-Host "Fixing: $route"
            
            # Find the last import line
            $lines = $content -split "`n"
            $lastImportIndex = 0
            
            for ($i = 0; $i < $lines.Length; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            
            # Insert dynamic directive after imports
            $newLines = @()
            for ($i = 0; $i <= $lastImportIndex; $i++) {
                $newLines += $lines[$i]
            }
            $newLines += ""
            $newLines += "// Force dynamic rendering - this route uses authentication"
            $newLines += "export const dynamic = 'force-dynamic'"
            $newLines += "export const revalidate = 0"
            
            for ($i = $lastImportIndex + 1; $i < $lines.Length; $i++) {
                $newLines += $lines[$i]
            }
            
            $newContent = $newLines -join "`n"
            Set-Content $filePath -Value $newContent -NoNewline
            
            Write-Host "✅ Fixed: $route" -ForegroundColor Green
        } else {
            Write-Host "⏭️  Skipped (already has directive): $route" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Not found: $route" -ForegroundColor Red
    }
}

Write-Host "`n✅ All routes have been updated!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the changes" -ForegroundColor Cyan
Write-Host "2. Run: git add -A" -ForegroundColor Cyan
Write-Host "3. Run: git commit -m 'Fix dynamic rendering for all API routes'" -ForegroundColor Cyan
Write-Host "4. Run: git push" -ForegroundColor Cyan
