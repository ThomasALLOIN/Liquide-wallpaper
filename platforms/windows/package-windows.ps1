[CmdletBinding()]
param(
    [string]$Destination
)

$ErrorActionPreference = "Stop"

if ([System.Environment]::OSVersion.Platform -ne [System.PlatformID]::Win32NT) {
    throw "Ce script est reserve a Windows."
}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$DistDirectory = Join-Path $ProjectRoot "dist\windows"
if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path $DistDirectory "Liquide-Wallpaper-Lively.zip"
}

$SharedItems = @("index.html", "assets", "src", "liquide-wallpaper-settings.json", "Lancer-Widget-Windows.cmd")
$PlatformItems = @("LivelyInfo.json", "LivelyProperties.json", "Liquide-Wallpaper-Tray.ps1")

foreach ($Item in $SharedItems) {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot $Item))) {
        throw "Fichier commun manquant : $Item"
    }
}
foreach ($Item in $PlatformItems) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $Item))) {
        throw "Fichier Windows manquant : $Item"
    }
}

New-Item -ItemType Directory -Path $DistDirectory -Force | Out-Null
$TemporaryDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("Liquide-Wallpaper-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $TemporaryDirectory | Out-Null

try {
    foreach ($Item in $SharedItems) {
        Copy-Item -LiteralPath (Join-Path $ProjectRoot $Item) -Destination $TemporaryDirectory -Recurse
    }
    foreach ($Item in $PlatformItems) {
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot $Item) -Destination $TemporaryDirectory
    }

    if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Force
    }

    Compress-Archive -Path (Join-Path $TemporaryDirectory "*") -DestinationPath $Destination -CompressionLevel Optimal
    Write-Host "Paquet Lively cree : $Destination" -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $TemporaryDirectory) {
        Remove-Item -LiteralPath $TemporaryDirectory -Recurse -Force
    }
}
