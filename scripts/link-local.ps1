#Requires -Version 7
<#
.SYNOPSIS
Makes the skills discoverable inside this repository while working on them.

.DESCRIPTION
The Windows counterpart of scripts/link-local.sh. Links plugin\skills\<name>
into .claude\skills, the per-project location Claude Code scans. That
directory is gitignored, so nothing here is committed.

On Windows the links are directory junctions, which need no administrator
rights and no developer mode; elsewhere they are symbolic links.

.PARAMETER Remove
Delete the links again.
#>
[CmdletBinding()]
param(
  [switch] $Remove
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsSrc = Join-Path $repoRoot 'plugin' 'skills'
$claudeDir = Join-Path $repoRoot '.claude' 'skills'

if ($Remove) {
  if (Test-Path -LiteralPath $claudeDir) {
    Remove-Item -LiteralPath $claudeDir -Recurse -Force
  }
  Write-Host 'removed local skill links'
  return
}

if (-not (Test-Path -LiteralPath $skillsSrc)) {
  [Console]::Error.WriteLine("error: $skillsSrc not found")
  exit 1
}

# Junction is Windows-only and needs no elevation. SymbolicLink is what the
# other platforms have, and creating one there needs no elevation either.
$linkType = if ($IsWindows) { 'Junction' } else { 'SymbolicLink' }

New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null

$count = 0
foreach ($src in Get-ChildItem -LiteralPath $skillsSrc -Directory) {
  $link = Join-Path $claudeDir $src.Name
  if ($null -ne (Get-Item -LiteralPath $link -Force -ErrorAction Ignore)) {
    Remove-Item -LiteralPath $link -Recurse -Force
  }
  New-Item -ItemType $linkType -Path $link -Target $src.FullName | Out-Null
  Write-Host "linked $($src.Name)"
  $count++
}

# A skill that was renamed or deleted leaves a link behind that points at
# nothing. Claude Code keeps scanning the directory, so clear the dead ones
# rather than emptying the directory, which may hold links this script did
# not make.
$pruned = 0
foreach ($item in Get-ChildItem -LiteralPath $claudeDir -Force) {
  if (-not $item.LinkType) { continue }
  if ($item.Target -and (Test-Path -LiteralPath $item.Target)) { continue }
  Remove-Item -LiteralPath $item.FullName -Force
  Write-Host "pruned $($item.Name) (no longer a skill)"
  $pruned++
}

Write-Host ''
Write-Host "$count skill(s) linked into .claude\skills, $pruned pruned"
