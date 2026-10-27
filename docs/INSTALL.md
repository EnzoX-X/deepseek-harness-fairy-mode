# 安装细节

## 一键安装做了什么

`install.cmd` 只是调用 `scripts/install.ps1`，没有隐藏动作。脚本按顺序执行：

1. **定位 DSH 配置目录**：优先 `$env:DSH_HOME`，否则 `%USERPROFILE%\.dsh`。
2. **选择 profile**：默认 `desktop`；只有一个 profile 时用它；多个时要求 `-ProfileName`。
3. **检查 DSH 是否在运行**：在运行则退出并提示（`-Force` 可跳过，但可能导致文件占用）。
4. **复制插件**到 `%USERPROFILE%\.dsh\plugins\fairy-mode\`：
   - `fairy-preset`
   - `zzz-fairy-skin`
   已有同名目录时，先改名为 `*.bak-<时间戳>` 再复制。
5. **修改 profile 的 `package.json`**：
   - `dependencies` 增加两个 `link:` 本地依赖；
   - `dsh.profile.bundles` 追加两个包名；
   - 原文件备份为 `package.json.bak-fairy-<时间戳>`。
6. **调用 DSH 自带的 pnpm**：先 `install --offline`，失败则联网重试。
7. **检查** `node_modules\@local\dsh-fairy-preset` 与 `...dsh-zzz-fairy-skin` 是否已链接。

修改后的 `package.json` 片段大致如下：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@local/dsh-zzz-fairy-skin",
        "@local/dsh-fairy-preset"
      ]
    }
  },
  "dependencies": {
    "@local/dsh-fairy-preset": "link:C:/Users/<you>/.dsh/plugins/fairy-mode/fairy-preset",
    "@local/dsh-zzz-fairy-skin": "link:C:/Users/<you>/.dsh/plugins/fairy-mode/zzz-fairy-skin"
  }
}
```

## 参数

| 参数 | 作用 |
| --- | --- |
| `-DryRun` | 只打印将要执行的动作，不复制、不改文件 |
| `-ProfileName <name>` | 指定 profile，默认 `desktop` |
| `-SkipPnpm` | 只改 `package.json`，不运行 pnpm |
| `-Force` | DSH 正在运行时也继续 |

示例：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -DryRun
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -ProfileName desktop
```

## 包被复制到哪里

`%USERPROFILE%\.dsh\plugins\fairy-mode\`。这是一个**独立于下载目录**的位置，所以解压到桌面后再移动原压缩包不会影响安装。

要改插件目录，编辑 profile 的 `package.json` 中两个 `link:` 路径，然后重新运行 `pnpm install`；或卸载后重装。

## 手动安装（图形界面）

1. 设置 → **插件** → **添加插件** 旁的箭头 → **选择添加插件方式**。
2. 选择 **安装第三方插件**，在对话框中选择 **本地目录**。
3. 指向 `plugins\zzz-fairy-skin`，安装；再重复一次安装 `plugins\fairy-preset`。
4. 确认两者启用，按提示重启 DSH。
5. 新会话选择预设 **Fairy**。

DSH 会记住所选目录的路径，安装后不要移动这些目录。

## 回滚

安装器每次都会备份：

- `package.json.bak-fairy-<时间戳>`
- 旧插件目录 `fairy-mode\<name>.bak-<时间戳>`

手动回滚：

```powershell
$profile = "$env:USERPROFILE\.dsh\profiles\desktop"
Copy-Item "$profile\package.json.bak-fairy-<时间戳>" "$profile\package.json" -Force
```

然后启动 DSH，或在 profile 目录运行一次 pnpm install。

## 常见失败

| 现象 | 处理 |
| --- | --- |
| `找不到 DSH 配置目录` | 先安装并启动一次 DSH，确认 `%USERPROFILE%\.dsh\profiles` 存在 |
| `DeepSeek Harness 正在运行` | 托盘退出 DSH，确认任务管理器无残留进程 |
| pnpm 报文件占用 | 退出 DSH、关闭杀毒软件的实时扫描后重试 |
| 找不到 node/pnpm | 脚本会提示；改用图形界面手动安装 |
| 安装后界面无变化 | 重启 DSH；插件页确认启用；`Ctrl+Shift+R` |
