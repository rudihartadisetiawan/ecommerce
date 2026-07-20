# Backup database MySQL ke file SQL
# Jalankan: powershell -File scripts\backup-db.ps1
# Bisa dijadwalkan via Task Scheduler Windows

param(
    [string]$OutputDir = ".\backups"
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$file = Join-Path $OutputDir "gaul_backup_$timestamp.sql"

if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force }

# Baca DATABASE_URL dari .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$dbUrl = ""
foreach ($line in $envContent) {
    if ($line -match '^DATABASE_URL="(.+)"$') { $dbUrl = $matches[1]; break }
    if ($line -match "^DATABASE_URL=(.+)$" -and $line -notmatch "^#") { $dbUrl = $matches[1]; break }
}

if (-not $dbUrl) { Write-Error "DATABASE_URL tidak ditemukan di .env"; exit 1 }

# Parse MySQL connection string: mysql://user:pass@host:port/db
$pattern = 'mysql://(.+?):(.+?)@(.+?):(\d+)/(.+?)$'
if ($dbUrl -notmatch $pattern) { Write-Error "Format DATABASE_URL tidak dikenal"; exit 1 }
$user = $matches[1]; $pass = $matches[2]; $hostname = $matches[3]; $port = $matches[4]; $database = $matches[5]

# Set password env var untuk mysqldump
$env:MYSQL_PWD = $pass

mysqldump -h $hostname -P $port -u $user $database --routines --triggers --single-transaction > $file

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup berhasil: $file"
    # Hapus backup lebih dari 7 hari
    Get-ChildItem $OutputDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item
} else {
    Write-Error "❌ Backup gagal"
}
