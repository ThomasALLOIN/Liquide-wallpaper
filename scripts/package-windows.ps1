[CmdletBinding()]
param(
    [string]$Destination
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PlatformScript = Join-Path $ProjectRoot "platforms\windows\package-windows.ps1"

if ([string]::IsNullOrWhiteSpace($Destination)) {
    & $PlatformScript
}
else {
    & $PlatformScript -Destination $Destination
}
