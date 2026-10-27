# 二次开发

## 两个插件

### `fairy-preset`

纯配置插件，没有运行时代码。`cordis.patch.yml` 用 `@deepseek-ai/dsh-agent-preset` 注册一个 id 为 `fairy` 的预设：

- `persona.prefix`：身份、关系、做事方式、语气、幽默、分寸；
- `persona.suffix`：最终身份校验；
- 其余插件列表与 `standard` 预设一致（工具、计划模式、压缩、子智能体、web、present 等）。

想改人格，只改 `prefix` / `suffix`；想改能力，增删这个列表里的条目。

### `zzz-fairy-skin`

客户端插件 + Host 插件：

- `client.js`：浏览器端全部 UI。主要结构：
  - `TOKENS`：配色变量；
  - `SKIN_CSS`：样式与动画；
  - `Orb`：Fairy 球体 SVG（动态/静态两种）；
  - `BrandName`：侧栏字标；
  - `FloatingOrb`：左下角大图标；
  - `BootOverlay` / `BootHero`：开屏；
  - 会话区、输入框、余额胶囊等覆写。
- `index.js`：Host 端，注册三个路由：
  - `/zzz-fairy/balance`：转发账户余额；
  - `/zzz-fairy/tts`：语音合成（GPT-SoVITS 或 SAPI）；
  - `/zzz-fairy/boot.mp4`、`/zzz-fairy/boot-bg.png`：开屏素材（支持 Range）。
- `tts-lifecycle.js`：按需启动本机语音服务、并发排队、120 秒超时。
- `assets/`：开屏视频与背景图。
- `locale/`：插件页显示名。

## 动画不变量

改左下角大图标时保持这几条，否则会“看起来不像”：

1. 最外层蓝色圆盘固定，位置和大小不变。
2. 四个三角属于旋转圆环，只旋转，不随内圈缩放。
3. 内圈独立呼吸（`zzz-orb-breath`）。
4. 右下高光完全静止。
5. 白色扩散光圈约 2 秒扩散消失，线条较粗、带柔光。
6. 短路脉冲是一次强亮 + 2～3 次快速闪烁；电波干扰是 15 条水平切片错位。
7. 侧栏/界面小图标使用静态模式，不继承大图标动画。

当前基线参数：旋转 `16s linear`、呼吸 `4.6s ease-in-out`、光圈 `2s ease-out`、脉冲/干扰总周期 `7.2s`。

## 本地检查

```powershell
cd plugins\zzz-fairy-skin
node --check client.js
node --check index.js
node --check tts-lifecycle.js
```

改完在 DSH 里按 `Ctrl+Shift+R`；Host 端改动（`index.js`）需要重启 DSH。

## profile 与安装的关系

DSH 把插件当作 profile 的依赖：

- `package.json` 的 `dsh.profile.bundles` 决定加载顺序；
- `dependencies` 里的 `link:` 指向插件目录；
- DSH 自带 pnpm 负责把 `link:` 变成 `node_modules\@local\...`。

因此“安装插件”= 改这两处 + 跑一次 pnpm。安装器就是把这套动作自动化。

## 发布

在仓库根运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\release\build-release.ps1
```

产物在 `dist/`：`Fairy-Mode-v<version>.zip` 与 `SHA256SUMS.txt`。

发版前检查：

- [ ] 两个 `package.json` 版本号已提升；
- [ ] `client.js` 通过 `node --check`；
- [ ] 在干净 profile 上装一遍（`-DryRun` 先看动作）；
- [ ] `CHANGELOG.md` 已更新；
- [ ] zip 内没有 `.bak`、日志、个人路径。
