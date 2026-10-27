#requires -Version 5.1
<#
.SYNOPSIS
    Remove Fairy Mode from a DeepSeek Harness profile.

.DESCRIPTION
    Deletes both entries from the profile's dependencies and
    dsh.profile.bundles, runs the bundled pnpm, and (unless -KeepFiles) removes
    the copied plugin directory under <DSH_HOME>\plugins\fairy-mode.

.PARAMETER ProfileName
    DSH profile name. Defaults to "desktop", or the only profile.

.PARAMETER KeepFiles
    Leave the copied plugin files in place; only unregister them.

.PARAMETER DryRun
    Show what would change without touching files.
#>
[CmdletBinding()]
param(
    [string]$ProfileName,
    [switch]$KeepFiles,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Text) { Write-Host "`n==> $Text" -ForegroundColor Cyan }
function Write-Info([string]$Text) { Write-Host "    $Text" }
function Write-Ok([string]$Text)   { Write-Host "    [OK] $Text" -ForegroundColor Green }
function Write-Warn2([string]$Text){ Write-Host "    [!] $Text" -ForegroundColor Yellow }

$pluginNames = @('@local/dsh-fairy-preset', '@local/dsh-zzz-fairy-skin')
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$profilesDir = Join-Path $dshHome 'profiles'

if (-not $ProfileName) {
    $all = @(Get-ChildItem -Directory $profilesDir -ErrorAction SilentlyContinue)
    $desktop = $all | Where-Object { $_.Name -eq 'desktop' }
    if ($desktop) { $ProfileName = 'desktop' }
    elseif ($all.Count -eq 1) { $ProfileName = $all[0].Name }
    else { throw "检测到多个 DSH profile，请用 -ProfileName 指定：$($all.Name -join ', ')" }
}

$profileDir = Join-Path $profilesDir $ProfileName
$pkgJson = Join-Path $profileDir 'package.json'
if (-not (Test-Path $pkgJson)) { throw "profile 缺少 package.json：$pkgJson" }

$running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'DeepSeek Harness' })
if ($running.Count -gt 0) {
    throw "DeepSeek Harness 正在运行（PID: $($running.Id -join ', ')）。请先完全退出再卸载。"
}

Write-Step "卸载 Fairy 模式"
Write-Info "profile: $ProfileName"

$json = Get-Content -LiteralPath $pkgJson -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($name in $pluginNames) {
    if ($json.PSObject.Properties['dependencies'] -and $json.dependencies.PSObject.Properties[$name]) {
        $json.dependencies.PSObject.Properties.Remove($name)
        Write-Info "dependencies -= $name"
    }
    if ($json.PSObject.Properties['dsh'] -and $json.dsh.PSObject.Properties['profile'] -and
        $json.dsh.profile.PSObject.Properties['bundles']) {
        $bundles = @($json.dsh.profile.bundles) | Where-Object { $_ -ne $name }
        $json.dsh.profile.bundles = $bundles
        Write-Info "bundles      -= $name"
    }
}

if ($DryRun) {
    Write-Step "dry-run：未修改任何文件"
    return
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath $pkgJson -Destination "$pkgJson.bak-remove-fairy-$stamp"
[System.IO.File]::WriteAllText($pkgJson, (($json | ConvertTo-Json -Depth 20) + "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Ok "package.json 已更新"

# run pnpm again so node_modules drops the links
$dshRoot = $null
$proc = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'DeepSeek Harness' } | Select-Object -First 1
if ($proc -and $proc.Path) { $dshRoot = Split-Path -Parent $proc.Path }
if (-not $dshRoot) {
    foreach ($dir in @((Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness'), 'D:\deepseek harness')) {
        if (Test-Path (Join-Path $dir 'resources')) { $dshRoot = $dir; break }
    }
}

$nodeExe = $null
$pnpmCjs = $null
if ($dshRoot) {
    $nodeExe = Join-Path $dshRoot 'resources\runtime\primary-runtime\dependencies\node\bin\node.exe'
    $pnpmCjs = Join-Path $dshRoot 'resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.cjs'
}
if (-not (Test-Path $nodeExe)) {
    $runtimeRoot = Join-Path $dshHome 'dsh-runtimes'
    if (Test-Path $runtimeRoot) {
        Get-ChildItem $runtimeRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $candidate = Join-Path $_.FullName 'dependencies\node\bin\node.exe'
            if (-not $nodeExe -and (Test-Path $candidate)) { $nodeExe = $candidate }
            $candidatePnpm = Join-Path $_.FullName 'dependencies\pnpm\bin\pnpm.cjs'
            if (-not $pnpmCjs -and (Test-Path $candidatePnpm)) { $pnpmCjs = $candidatePnpm }
        }
    }
}
if (-not (Test-Path $nodeExe)) {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { $nodeExe = $cmd.Source }
}
if (-not (Test-Path $pnpmCjs)) {
    $cmd = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($cmd) { $pnpmCjs = $cmd.Source }
}

if ($nodeExe -and $pnpmCjs) {
    Push-Location $profileDir
    try {
        & $nodeExe $pnpmCjs install --offline 2>&1 | ForEach-Object { Write-Host "    $_" }
        if ($LASTEXITCODE -ne 0) { & $nodeExe $pnpmCjs install 2>&1 | ForEach-Object { Write-Host "    $_" } }
    } finally { Pop-Location }
} else {
    Write-Warn2 "找不到 node/pnpm，启动 DSH 后请在插件设置里执行一次安装。"
}

if (-not $KeepFiles) {
    $destRoot = Join-Path $dshHome 'plugins\fairy-mode'
    if (Test-Path $destRoot) {
        Remove-Item -LiteralPath $destRoot -Recurse -Force
        Write-Ok "已删除插件文件：$destRoot"
    }
} else {
    Write-Info "保留插件文件：$(Join-Path $dshHome 'plugins\fairy-mode')"
}

Write-Step "完成"
Write-Host "    重新启动 DeepSeek Harness 生效。" -ForegroundColor Gray
