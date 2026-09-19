#Requires -Version 7
<#
.SYNOPSIS
Installs the skills into ~\.claude\skills, where Claude Code discovers
personal skills in every project.

.DESCRIPTION
The Windows counterpart of scripts/install.sh. Each plugin\skills\<name>
directory is copied whole, so the installed copy is independent of this
checkout. To work on the skills instead, use scripts\link-local.ps1.

.PARAMETER Force
Overwrite skills that are already installed.

.PARAMETER DryRun
Print what would happen and change nothing.
#>
[CmdletBinding()]
param(
  [switch] $Force,
  [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsSrc = Join-Path $repoRoot 'plugin' 'skills'
$claudeDir = Join-Path $HOME '.claude' 'skills'

if (-not (Test-Path -LiteralPath $skillsSrc)) {
  [Console]::Error.WriteLine("error: $skillsSrc not found")
  exit 1
}

# install.sh treats a name as taken when -e or -L holds, so a link left
# pointing at a directory that has gone still counts as installed. Get-Item
# with -Force asks that question directly: does the name exist, link or not.
function Test-Occupied ([string] $path) {
  return $null -ne (Get-Item -LiteralPath $path -Force -ErrorAction Ignore)
}

$installed = 0
$skipped = 0

foreach ($src in Get-ChildItem -LiteralPath $skillsSrc -Directory) {
  $dest = Join-Path $claudeDir $src.Name

  if ((Test-Occupied $dest) -and -not $Force) {
    Write-Host "skip   $($src.Name) (already installed; use -Force to replace)"
    $skipped++
    continue
  }

  if ($DryRun) {
    Write-Host "would   copy $($src.Name) -> $dest"
  } else {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    if (Test-Occupied $dest) {
      Remove-Item -LiteralPath $dest -Recurse -Force
    }
    Copy-Item -LiteralPath $src.FullName -Destination $dest -Recurse
    Write-Host "copied $($src.Name) -> $dest"
  }
  $installed++
}

Write-Host ''
if ($DryRun) {
  Write-Host "$installed skill(s) would be installed, $skipped skipped"
} else {
  Write-Host "$installed skill(s) installed, $skipped skipped"
  if ($installed -gt 0) {
    Write-Host 'Start a new session for the skills to be discovered.'
  }
}
