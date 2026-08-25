Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$PackagedSettingsPath = Join-Path $PSScriptRoot "liquide-wallpaper-settings.json"
$SourceSettingsPath = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "liquide-wallpaper-settings.json"
$SettingsPath = if (Test-Path -LiteralPath $PackagedSettingsPath) { $PackagedSettingsPath } else { $SourceSettingsPath }

function Get-Defaults {
    [pscustomobject]@{
        flowSpeed = 16; distortion = 46
        dayBaseColor = "#e7e5df"; dayVeinColor = "#181a1d"
        nightBaseColor = "#08090b"; nightVeinColor = "#7c7d80"
    }
}
function Get-Settings {
    if (Test-Path -LiteralPath $SettingsPath) {
        try { return (Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json) } catch { }
    }
    return Get-Defaults
}
function Save-Settings($settings) {
    $settings | ConvertTo-Json | Set-Content -LiteralPath $SettingsPath -Encoding UTF8
}
function Get-Color([string]$hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Get-Hex([System.Drawing.Color]$color) { "#{0:X2}{1:X2}{2:X2}" -f $color.R, $color.G, $color.B }

$settings = Get-Settings
$form = New-Object System.Windows.Forms.Form
$form.Text = "Liquide-Wallpaper"
$form.Size = New-Object System.Drawing.Size(330, 430)
$form.FormBorderStyle = "FixedToolWindow"
$form.StartPosition = "CenterScreen"
$form.BackColor = Get-Color "#101216"
$form.ForeColor = Get-Color "#F1EEE6"
$form.Font = New-Object System.Drawing.Font("Segoe UI", 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = "MARBRE · RÉGLAGES"
$title.Location = New-Object System.Drawing.Point(24, 22)
$title.Size = New-Object System.Drawing.Size(270, 28)
$title.Font = New-Object System.Drawing.Font("Segoe UI Semibold", 12)
$form.Controls.Add($title)

$colorDialog = New-Object System.Windows.Forms.ColorDialog
$colorButtons = @{}
$colorNames = @(
    @{ key = "dayBaseColor"; label = "Jour clair" }, @{ key = "dayVeinColor"; label = "Jour sombre" },
    @{ key = "nightBaseColor"; label = "Nuit graphite" }, @{ key = "nightVeinColor"; label = "Veines nuit" }
)
for ($i = 0; $i -lt $colorNames.Count; $i++) {
    $item = $colorNames[$i]
    $button = New-Object System.Windows.Forms.Button
    $button.Text = $item.label
    $button.Tag = $item.key
    $button.Location = New-Object System.Drawing.Point((28 + (($i % 2) * 140)), (70 + ([math]::Floor($i / 2) * 54)))
    $button.Size = New-Object System.Drawing.Size(124, 42)
    $button.FlatStyle = "Flat"
    $button.BackColor = Get-Color $settings.($item.key)
    $button.ForeColor = if ($button.BackColor.GetBrightness() -gt 0.55) { [System.Drawing.Color]::Black } else { [System.Drawing.Color]::White }
    $button.Add_Click({
        $key = $this.Tag
        $colorDialog.Color = $this.BackColor
        if ($colorDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            $this.BackColor = $colorDialog.Color
            $this.ForeColor = if ($this.BackColor.GetBrightness() -gt 0.55) { [System.Drawing.Color]::Black } else { [System.Drawing.Color]::White }
            $settings.$key = Get-Hex $colorDialog.Color
            Save-Settings $settings
        }
    })
    $form.Controls.Add($button)
}

function Add-Slider([string]$label, [int]$top, [int]$maximum, [string]$key) {
    $caption = New-Object System.Windows.Forms.Label
    $caption.Text = "$label : $($settings.$key)"
    $caption.Location = New-Object System.Drawing.Point(28, $top)
    $caption.Size = New-Object System.Drawing.Size(270, 24)
    $form.Controls.Add($caption)
    $slider = New-Object System.Windows.Forms.TrackBar
    $slider.Minimum = 0; $slider.Maximum = $maximum; $slider.TickFrequency = [Math]::Max(10, [int]($maximum / 8))
    $slider.Value = [Math]::Min($maximum, [Math]::Max(0, [int]$settings.$key))
    $slider.Location = New-Object System.Drawing.Point(24, ($top + 24))
    $slider.Size = New-Object System.Drawing.Size(276, 45)
    $slider.Add_ValueChanged({
        $settings.$key = $this.Value
        $caption.Text = "$label : $($this.Value)"
        Save-Settings $settings
    })
    $form.Controls.Add($slider)
}
Add-Slider "Vitesse (0–400 %)" 205 400 "flowSpeed"
Add-Slider "Déformation" 300 100 "distortion"

$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Text = "Liquide-Wallpaper"
$tray.Visible = $true
$tray.Add_Click({ $form.Show(); $form.Activate() })
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$open = $menu.Items.Add("Réglages du marbre")
$open.Add_Click({ $form.Show(); $form.Activate() })
$exit = $menu.Items.Add("Quitter")
$exit.Add_Click({ $tray.Visible = $false; [System.Windows.Forms.Application]::Exit() })
$tray.ContextMenuStrip = $menu
$form.Add_FormClosing({ $args[1].Cancel = $true; $form.Hide() })
[System.Windows.Forms.Application]::Run()
