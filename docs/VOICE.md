# 语音

皮肤自带朗读能力：Fairy 回复后可以自动或手动朗读。语音有两种来源。

## 默认：Windows 系统语音

不安装语音包时，`zzz-fairy-skin` 调用 Windows SAPI，音色固定为 `Microsoft Huihui Desktop`（中文女声）。

- 中文版 Windows 自带该音色；
- 英文系统可能没有，朗读会失败但不影响其他功能；
- 可以在「设置 → 时间和语言 → 语音」里安装中文语音包。

## Fairy 音色：本地 GPT-SoVITS

语音包（单独下载，约 1.8 GB）在本地运行 GPT-SoVITS v2，用 Fairy 的参考音与微调权重合成，不联网、不上传。

安装步骤见语音包内的 `README.md`，摘要：

1. 解压语音包到固定位置；
2. 双击 `install-voice.cmd`，等待依赖安装（10–30 分钟）；
3. 重启 DSH。

安装后会在 `%USERPROFILE%\.dsh\zzz-fairy-tts.json` 写入：

```json
{
  "url": "http://127.0.0.1:9880/tts",
  "refAudio": "D:/Fairy-Voice/voice/ref/fairy-ref.wav",
  "promptText": "了解我会如同主人使唤我一般使唤它，并且让它不敢有怨言。",
  "textLang": "zh",
  "promptLang": "zh",
  "launcher": "D:/Fairy-Voice/voice/start-tts.vbs"
}
```

皮肤每次朗读前会读取这个文件（缓存 5 秒），因此改完配置不需要重启 DSH。

- `url`：合成接口；
- `refAudio` / `promptText`：参考音与对应文本，决定音色；
- `launcher`：服务未启动时用来拉起服务（仅允许本机地址）。

## 服务行为

- 监听 `127.0.0.1:9880`；
- 首次需要的 1–2 分钟用于加载模型；
- 空闲 5 分钟自动退出，下次朗读再拉起；
- 同时最多 3 个请求，超出会提示“语音请求较多”。

## 排错

| 现象 | 检查 |
| --- | --- |
| 完全没声音 | 系统音量/输出设备；DSH 是否静音；`/fairy/health` |
| 有声音但音色不对 | `zzz-fairy-tts.json` 是否存在且 `url` 可访问 |
| 服务起不来 | `voice\tts-server.log` 末尾；端口 9880 是否被占用 |
| 安装失败 | 换 pip 镜像；确认 Python 3.10–3.12；磁盘空间 |

## 回退

删除 `%USERPROFILE%\.dsh\zzz-fairy-tts.json` 并重启 DSH，即回到系统语音。或运行语音包的 `uninstall-voice.cmd`。
