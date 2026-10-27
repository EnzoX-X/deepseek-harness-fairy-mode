#requires -Version 5.1
<#
.SYNOPSIS
    Build the distributable zip (and its SHA-256) from this repository.

.DESCRIPTION
    Stages plugins/, scripts/, docs/ and the top-level files into
    dist/staging/Fairy-Mode, strips local backups, and writes
    dist/Fairy-Mode-v<version>.zip plus dist/SHA256SUMS.txt.

.PARAMETER Version
    Override the version taken from plugins/zzz-fairy-skin/package.json.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\release\build-release.ps1
#>
[CmdletBinding()]
param([string]$Version)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

if (-not $Version) {
    $pkg = Get-Content (Join-Path $root 'plugins\zzz-fairy-skin\package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $Version = $pkg.version
}
if (-not $Version) { throw '无法确定版本号' }

$outDir = Join-Path $root 'dist'
$stageRoot = Join-Path $outDir 'staging'
$stage = Join-Path $stageRoot 'Fairy-Mode'

Write-Host "版本：$Version"
Write-Host "输出：$outDir"

if (Test-Path $stageRoot) { Remove-Item $stageRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$items = @('plugins', 'scripts', 'docs', 'README.md', 'LICENSE', 'NOTICE', 'CHANGELOG.md', 'install.cmd', 'uninstall.cmd')
foreach ($item in $items) {
    $src = Join-Path $root $item
    if (-not (Test-Path $src)) { throw "缺少：$src" }
    Copy-Item -LiteralPath $src -Destination $stage -Recurse -Force
}

# Never ship local backups or stray logs.
Get-ChildItem -LiteralPath $stage -Recurse -File -Force |
    Where-Object { $_.Name -like '*.bak*' -or $_.Name -like '*.log' -or $_.Name -eq 'Thumbs.db' } |
    Remove-Item -Force

# Quick syntax gate for the JS entry points.
function Find-Node {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = New-Object System.Collections.Generic.List[string]
    $proc = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'DeepSeek Harness' } | Select-Object -First 1
    if ($proc -and $proc.Path) { $candidates.Add((Join-Path (Split-Path -Parent $proc.Path) 'resources\runtime\primary-runtime\dependencies\node\bin\node.exe')) }
    $candidates.Add('D:\deepseek harness\resources\runtime\primary-runtime\dependencies\node\bin\node.exe')
    $candidates.Add((Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\node\bin\node.exe'))
    $runtimeRoot = Join-Path $env:USERPROFILE '.dsh\dsh-runtimes'
    if (Test-Path $runtimeRoot) {
        Get-ChildItem $runtimeRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $candidates.Add((Join-Path $_.FullName 'dependencies\node\bin\node.exe'))
        }
    }
    foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { return $c } }
    return $null
}

$nodeExe = Find-Node
if ($nodeExe) {
    foreach ($js in @('plugins\zzz-fairy-skin\client.js', 'plugins\zzz-fairy-skin\index.js', 'plugins\zzz-fairy-skin\tts-lifecycle.js')) {
        $path = Join-Path $stage $js
        & $nodeExe --check $path
        if ($LASTEXITCODE -ne 0) { throw "语法检查失败：$js" }
    }
    Write-Host "JS 语法检查通过（$nodeExe）"
} else {
    Write-Warning '未找到 node，跳过 JS 语法检查'
}

$zip = Join-Path $outDir "Fairy-Mode-v$Version.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path $stage -DestinationPath $zip -CompressionLevel Optimal
Write-Host "已生成：$zip ($([Math]::Round((Get-Item $zip).Length / 1MB, 1)) MB)"

$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
$sums = Join-Path $outDir 'SHA256SUMS.txt'
"$hash  Fairy-Mode-v$Version.zip" | Out-File -LiteralPath $sums -Encoding ASCII
Write-Host "SHA256: $hash"

Write-Host ''
Write-Host '发布到 GitHub Release：'
Write-Host "  gh release create v$Version `"$zip`" --title `"Fairy Mode v$Version`" --notes-file CHANGELOG.md"
