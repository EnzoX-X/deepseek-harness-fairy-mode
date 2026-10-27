#requires -Version 5.1
<#
.SYNOPSIS
    Install Fairy Mode (zzz-fairy-skin + fairy-preset) into DeepSeek Harness.

.DESCRIPTION
    Copies both local plugins to a stable directory under the DSH home, then
    registers them in one DSH profile (dependencies + dsh.profile.bundles) and
    runs the pnpm bundled with DSH so node_modules picks them up.

    Nothing is downloaded from the network except what pnpm already needs for
    the profile; the two plugins themselves are fully local.

.PARAMETER ProfileName
    DSH profile name under <DSH_HOME>\profiles. Defaults to "desktop", or the
    only profile when there is exactly one.

.PARAMETER DryRun
    Print the actions without copying files or editing package.json.

.PARAMETER Force
    Continue even when DeepSeek Harness appears to be running.

.PARAMETER SkipPnpm
    Edit package.json but do not run pnpm (you can start DSH and let its plugin
    manager finish the install).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
#>
[CmdletBinding()]
param(
    [string]$ProfileName,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$SkipPnpm
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Write-Step([string]$Text) { Write-Host "`n==> $Text" -ForegroundColor Cyan }
function Write-Info([string]$Text) { Write-Host "    $Text" }
function Write-Ok([string]$Text)   { Write-Host "    [OK] $Text" -ForegroundColor Green }
function Write-Warn2([string]$Text){ Write-Host "    [!] $Text" -ForegroundColor Yellow }

$packageRoot = Split-Path -Parent $PSScriptRoot
$pluginsSrc  = Join-Path $packageRoot 'plugins'

$pluginDirs = [ordered]@{
    '@local/dsh-fairy-preset'    = 'fairy-preset'
    '@local/dsh-zzz-fairy-skin'  = 'zzz-fairy-skin'
}

# ── locate DSH home / profile ────────────────────────────────────────────────
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$profilesDir = Join-Path $dshHome 'profiles'

if (-not (Test-Path $profilesDir)) {
    throw "找不到 DSH 配置目录：$profilesDir。请先安装并至少启动一次 DeepSeek Harness。"
}

if (-not $ProfileName) {
    $all = @(Get-ChildItem -Directory $profilesDir -ErrorAction SilentlyContinue)
    $desktop = $all | Where-Object { $_.Name -eq 'desktop' }
    if ($desktop) {
        $ProfileName = 'desktop'
    } elseif ($all.Count -eq 1) {
        $ProfileName = $all[0].Name
    } else {
        throw "检测到多个 DSH profile，请用 -ProfileName 指定：$($all.Name -join ', ')"
    }
}

$profileDir = Join-Path $profilesDir $ProfileName
$pkgJson    = Join-Path $profileDir 'package.json'
if (-not (Test-Path $pkgJson)) {
    throw "profile 缺少 package.json：$pkgJson"
}

Write-Step "目标"
Write-Info "DSH_HOME : $dshHome"
Write-Info "profile  : $ProfileName"
Write-Info "包根目录 : $packageRoot"

# ── running instance check ──────────────────────────────────────────────────
$running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'DeepSeek Harness' })
if ($running.Count -gt 0 -and -not $Force) {
    throw "DeepSeek Harness 正在运行（PID: $($running.Id -join ', ')）。请先完全退出，然后重新运行本脚本；确定要热装可加 -Force。"
}

# ── copy plugins to a stable location ───────────────────────────────────────
$destRoot = Join-Path $dshHome 'plugins\fairy-mode'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

Write-Step "复制插件"
foreach ($entry in $pluginDirs.GetEnumerator()) {
    $src = Join-Path $pluginsSrc $entry.Value
    $dst = Join-Path $destRoot $entry.Value
    if (-not (Test-Path $src)) { throw "安装包不完整，缺少：$src" }
    if ($DryRun) {
        Write-Info "[dry-run] 复制 $src -> $dst"
        continue
    }
    if (Test-Path $dst) {
        $backup = "$destRoot\$($entry.Value).bak-$stamp"
        Move-Item -LiteralPath $dst -Destination $backup
        Write-Info "已备份旧版本：$backup"
    }
    Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force
    Write-Ok "$($entry.Key) -> $dst"
}

# ── edit profile/package.json ───────────────────────────────────────────────
Write-Step "注册到 profile"
$json = Get-Content -LiteralPath $pkgJson -Raw -Encoding UTF8 | ConvertFrom-Json

if (-not $json.PSObject.Properties['dependencies']) {
    $json | Add-Member -NotePropertyName dependencies -NotePropertyValue (New-Object psobject)
}
if (-not $json.PSObject.Properties['dsh']) {
    $json | Add-Member -NotePropertyName dsh -NotePropertyValue (New-Object psobject)
}
if (-not $json.dsh.PSObject.Properties['profile']) {
    $json.dsh | Add-Member -NotePropertyName profile -NotePropertyValue (New-Object psobject)
}
if (-not $json.dsh.profile.PSObject.Properties['bundles']) {
    $json.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue @()
}

foreach ($entry in $pluginDirs.GetEnumerator()) {
    $target = Join-Path $destRoot $entry.Value
    $linkValue = 'link:' + ($target -replace '\\', '/')
    if ($json.dependencies.PSObject.Properties[$entry.Key]) {
        $json.dependencies.($entry.Key) = $linkValue
    } else {
        $json.dependencies | Add-Member -NotePropertyName $entry.Key -NotePropertyValue $linkValue
    }
    Write-Info "dependencies += $($entry.Key) = $linkValue"

    $bundles = @($json.dsh.profile.bundles)
    if ($bundles -notcontains $entry.Key) {
        $bundles += $entry.Key
        Write-Info "bundles      += $($entry.Key)"
    }
    $json.dsh.profile.bundles = $bundles
}

if ($DryRun) {
    Write-Step "dry-run：package.json 将变为"
    Write-Host ($json | ConvertTo-Json -Depth 20)
    Write-Step "dry-run 结束，未修改任何文件"
    return
}

$backupJson = "$pkgJson.bak-fairy-$stamp"
Copy-Item -LiteralPath $pkgJson -Destination $backupJson
Write-Info "已备份 package.json -> $backupJson"

$jsonText = $json | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($pkgJson, $jsonText + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Ok "package.json 已更新"

# ── run pnpm ────────────────────────────────────────────────────────────────
function Find-DshRoot {
    $candidates = New-Object System.Collections.Generic.List[string]
    $proc = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'DeepSeek Harness' } | Select-Object -First 1
    if ($proc -and $proc.Path) { $candidates.Add((Split-Path -Parent $proc.Path)) }
    $candidates.Add((Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness'))
    $candidates.Add('D:\deepseek harness')
    foreach ($key in @(
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )) {
        try {
            Get-ItemProperty $key -ErrorAction Stop |
                Where-Object { $_.DisplayName -like '*DeepSeek Harness*' } |
                ForEach-Object {
                    if ($_.InstallLocation) { $candidates.Add($_.InstallLocation.TrimEnd('\')) }
                    if ($_.DisplayIcon) { $candidates.Add((Split-Path -Parent ($_.DisplayIcon.Trim('"')))) }
                }
        } catch { }
    }
    foreach ($dir in $candidates) {
        if ($dir -and (Test-Path (Join-Path $dir 'resources'))) { return $dir }
    }
    return $null
}

if ($SkipPnpm) {
    Write-Step "已跳过 pnpm"
    Write-Warn2 "请启动 DSH，到「设置 → 插件」中确认 Fairy 插件处于启用状态。"
    return
}

$dshRoot = Find-DshRoot
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

if (-not $nodeExe -or -not $pnpmCjs) {
    Write-Step "未能自动完成 pnpm 安装"
    Write-Warn2 "找不到 DSH 自带的 node/pnpm。请启动 DSH，到「设置 → 插件」里对本 profile 执行一次安装/修复，或在 DSH 中重新启用插件。"
    return
}

Write-Step "链接依赖（pnpm）"
Write-Info "node: $nodeExe"
Write-Info "pnpm: $pnpmCjs"

Push-Location $profileDir
try {
    & $nodeExe $pnpmCjs install --offline 2>&1 | ForEach-Object { Write-Host "    $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Warn2 "离线安装失败，改为联网重试……"
        & $nodeExe $pnpmCjs install 2>&1 | ForEach-Object { Write-Host "    $_" }
    }
    $code = $LASTEXITCODE
} finally {
    Pop-Location
}

$linked = @()
foreach ($entry in $pluginDirs.GetEnumerator()) {
    $linkedPath = Join-Path $profileDir "node_modules\$($entry.Key)"
    if (Test-Path $linkedPath) { $linked += $entry.Key }
}

if ($code -ne 0 -or $linked.Count -ne $pluginDirs.Count) {
    Write-Step "安装未完全成功"
    Write-Warn2 "pnpm 退出码：$code；已链接：$($linked -join ', ')"
    Write-Warn2 "可尝试：启动 DSH →「设置 → 插件」→ 对本 profile 重新安装，或手动运行 pnpm install。"
    exit 1
}

Write-Ok "依赖已链接：$($linked -join ', ')"

Write-Step "完成"
Write-Host @"
    接下来：
      1. 完全退出并重新启动 DeepSeek Harness。
      2. 在会话顶部选择预设「Fairy」。
      3. 若界面没有变化，按 Ctrl+Shift+R 强制刷新。
      4. 语音说明见 README（默认可朗读，但音色为系统语音）。
"@ -ForegroundColor Gray
