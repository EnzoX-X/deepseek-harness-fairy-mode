# Changelog

## 1.0.0 — 2026-10-27

首个可分发的 Fairy 模式版本。

### 新增

- `zzz-fairy-skin` 1.0.0：绝区零 HDD 风格皮肤
  - 深蓝电光配色、侧栏字标、会话区与输入框覆写
  - 左下角动态 Fairy 标志（旋转环 + 呼吸内圈 + 扩散光圈 + 短路脉冲 + 电波撕裂）
  - 开屏动画（视频 + 落地过渡 + 开机问候）
  - 余额胶囊、消息朗读（SAPI / GPT-SoVITS 双 provider）
  - 开屏素材缺失时自动跳过视频
- `fairy-preset` 1.0.0：Fairy 人格预设
  - 身份边界、称呼、做事方式、语气节奏、一本正经拆台的幽默、分寸
  - 工具链与 `standard` 预设一致
- Windows 安装器：`install.cmd` / `scripts/install.ps1`
  - 复制到固定目录、注册 profile、调用 DSH 内置 pnpm
  - `-DryRun`、`-ProfileName`、`-SkipPnpm`、`-Force`
  - 自动备份 `package.json` 与旧插件目录
- 卸载器：`uninstall.cmd` / `scripts/uninstall.ps1`
- 文档：安装、语音、二次开发、回滚与排错

### 已知限制

- 仅在 Windows 11 + DSH 44.7.0 上验证；其他版本未测试。
- 皮肤只覆盖 Web GUI，不影响原生窗口与托盘。
- 开屏视频约 74 MB；可删除以减小体积。
- 语音包需要单独下载与安装。
