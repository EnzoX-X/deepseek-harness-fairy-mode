/**
 * Host half of the Fairy skin bundle.
 *
 * Things the browser half cannot do on its own:
 *
 *   1. `GET /zzz-fairy/balance` — the Client runtime hands dynamic client
 *      plugins only the shell services (slots/theme/locale/sessions/...), never
 *      the account Remote, so the "remaining credit" chip is bridged here.
 *
 *   2. `POST /zzz-fairy/tts` — speech synthesis for Fairy's voice replies.
 *      Two providers are wired behind one route:
 *        - `gpt-sovits`: a local GPT-SoVITS HTTP server (env ZZZ_FAIRY_TTS_URL),
 *          which is the only way to reproduce the trained Fairy timbre.
 *        - `sapi`: the Windows speech engine, always available offline.
 *
 *   3. `GET /zzz-fairy/boot.mp4` and `/zzz-fairy/boot-bg.png` — the opening
 *      animation assets, streamed with Range support (the MP4 is 71 MB and the
 *      player needs seeks).
 *
 * Nothing here touches the harness itself; every route rides the existing
 * loopback web server.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createVoiceLifecycle } from './tts-lifecycle.js';

const voiceLifecycle = createVoiceLifecycle();

export const inject = ['webServer', 'deepseekAccount'];

/** JSON reply helper. */
function reply(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

/* ─────────────────────────────── assets ─────────────────────────────── */

const ASSET_DIR = fileURLToPath(new URL('./assets/', import.meta.url));
const ASSET_TYPES = { mp4: 'video/mp4', png: 'image/png', svg: 'image/svg+xml' };

/** Stream one bundled asset, honouring Range so the boot video can seek. */
async function serveAsset(req, res, name) {
  const type = ASSET_TYPES[name.split('.').pop()];
  const file = join(ASSET_DIR, name);
  if (!type || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  const info = await stat(file);
  const headers = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'no-store' };
  const range = req.headers.range;
  if (typeof range === 'string') {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = match && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start >= info.size || start > end) {
      res.writeHead(416, { 'content-range': `bytes */${info.size}` });
      res.end();
      return;
    }
    res.writeHead(206, Object.assign({}, headers, {
      'content-range': `bytes ${start}-${end}/${info.size}`,
      'content-length': end - start + 1,
    }));
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = createReadStream(file, { start, end });
    res.once('close', () => stream.destroy());
    stream.on('error', () => res.destroy());
    stream.pipe(res);
    return;
  }
  res.writeHead(200, Object.assign({}, headers, { 'content-length': info.size }));
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = createReadStream(file);
  res.once('close', () => stream.destroy());
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

/* ─────────────────────────────── voice ─────────────────────────────── */

const TTS_DIR = join(tmpdir(), 'zzz-fairy-tts');
const SAPI_SCRIPT = join(TTS_DIR, 'speak.ps1');
const PS_EXE = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const SAPI_VOICE = 'Microsoft Huihui Desktop';
const MAX_SPEECH_CHARS = 900;

/** The PowerShell driver: text in a UTF-8 file, WAV out, no shell quoting. */
const SAPI_PS1 = `param([string]$TextPath, [string]$OutPath, [string]$VoiceName)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$text = [System.IO.File]::ReadAllText($TextPath, [System.Text.Encoding]::UTF8)
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
if ($VoiceName) { try { $synth.SelectVoice($VoiceName) } catch { } }
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile($OutPath)
try { $synth.Speak($text) } finally { $synth.Dispose() }
`;

/** Cut at a sentence boundary near `limit`, so speech does not stop mid-phrase. */
function truncateForSpeech(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const stop = Math.max(
    cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'),
    cut.lastIndexOf('；'), cut.lastIndexOf('\n'), cut.lastIndexOf('. '),
  );
  return stop >= 60 ? cut.slice(0, stop + 1) : cut;
}

/** Strip what should never be read aloud (code, markup, URLs, emoji runs). */
function speechText(raw) {
  let text = String(raw ?? '');
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`[^`]*`/g, ' ');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/https?:\/\/\S+/g, ' ');
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, '');
  text = text.replace(/^\s{0,3}>\s?/gm, '');
  text = text.replace(/[*_~]{1,3}/g, '');
  text = text.replace(/[|]{2,}/g, '，');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{2,}/g, '。\n');
  text = text.trim();
  if (text.length > MAX_SPEECH_CHARS) {
    const cut = text.slice(0, MAX_SPEECH_CHARS);
    const stop = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'), cut.lastIndexOf('\n'));
    text = stop > 40 ? cut.slice(0, stop + 1) : cut;
  }
  return text;
}

/** Run the SAPI driver for one text; resolves to a WAV buffer. */
function sapiSpeak(text, voiceName) {
  return new Promise((resolve, reject) => {
    const stamp = createHash('sha1').update(text).digest('hex').slice(0, 16);
    const textPath = join(TTS_DIR, `${stamp}.txt`);
    const outPath = join(TTS_DIR, `${stamp}.wav`);
    (async () => {
      await mkdir(TTS_DIR, { recursive: true });
      if (!existsSync(SAPI_SCRIPT)) await writeFile(SAPI_SCRIPT, SAPI_PS1, 'utf8');
      if (existsSync(outPath)) return readFile(outPath);
      await writeFile(textPath, text, 'utf8');
      /* The Electron main process inherits a PSModulePath aimed at the app's
         resources, which makes powershell.exe fail before it loads
         System.Management.Automation. Pin the absolute executable and a clean
         module path so the engine boots normally. */
      const env = { ...process.env };
      delete env.ELECTRON_RUN_AS_NODE;
      delete env.ELECTRON_NO_ATTACH_CONSOLE;
      delete env.NODE_OPTIONS;
      env.PSModulePath = 'C:\\Windows\\system32\\WindowsPowerShell\\v1.0\\Modules';
      const child = spawn(PS_EXE, [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', SAPI_SCRIPT,
        '-TextPath', textPath,
        '-OutPath', outPath,
        '-VoiceName', voiceName,
      ], { windowsHide: true, env });
      let stderr = '';
      child.stderr.on('data', (chunk) => { stderr += String(chunk); });
      const timer = setTimeout(() => { try { child.kill(); } catch { /* ignore */ } }, 30000);
      child.on('error', (error) => { clearTimeout(timer); reject(error); });
      child.on('close', async (code) => {
        clearTimeout(timer);
        try {
          if (code !== 0) throw new Error(`sapi exited ${code}: ${stderr.slice(0, 200)}`);
          const buffer = await readFile(outPath);
          unlink(textPath).catch(() => {});
          resolve(buffer);
        } catch (error) { reject(error); }
      });
    })().catch(reject);
  });
}

/**
 * Forward to a local GPT-SoVITS server that carries the trained Fairy timbre.
 * The contract is GPT-SoVITS `api_v2.py`: POST /tts with JSON, audio bytes back.
 */
async function gptSovitsSpeak(config, text) {
  const response = await fetch(config.url, {
    signal: AbortSignal.timeout(180000),
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      text_lang: config.textLang || 'zh',
      ref_audio_path: config.refAudio || '',
      prompt_text: config.promptText || '',
      prompt_lang: config.promptLang || 'zh',
      text_split_method: 'cut5',
      batch_size: 1,
      media_type: 'wav',
      streaming_mode: false,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`gpt-sovits HTTP ${response.status} ${detail.slice(0, 160)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Which voice answers. Read from `ZZZ_FAIRY_TTS_URL`, else from
 * `$DSH_HOME/zzz-fairy-tts.json` so the timbre can be switched without
 * restarting the Host. Falls back to the Windows engine.
 */
let configCache = null;
let configCacheAt = 0;

async function ttsConfig() {
  if (configCache && Date.now() - configCacheAt < 5000) return configCache;
  let config = { provider: 'sapi', voice: SAPI_VOICE };
  const envUrl = process.env.ZZZ_FAIRY_TTS_URL;
  if (envUrl) {
    config = {
      provider: 'gpt-sovits',
      url: envUrl,
      refAudio: process.env.ZZZ_FAIRY_TTS_REF_AUDIO || '',
      promptText: process.env.ZZZ_FAIRY_TTS_PROMPT_TEXT || '',
    };
  } else {
    try {
      const home = process.env.DSH_HOME || join(homedir(), '.dsh');
      const raw = await readFile(join(home, 'zzz-fairy-tts.json'), 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.url === 'string' && parsed.url) {
        config = {
          provider: 'gpt-sovits',
          url: parsed.url,
          refAudio: parsed.refAudio || '',
          promptText: parsed.promptText || '',
          textLang: parsed.textLang || 'zh',
          promptLang: parsed.promptLang || 'zh',
          launcher: typeof parsed.launcher === 'string' ? parsed.launcher : '',
        };
      }
    } catch { /* no config file: stay on the system voice */ }
  }
  configCache = config;
  configCacheAt = Date.now();
  return config;
}

/* ─────────────────────────────── plugin ─────────────────────────────── */

export function apply(ctx) {
  const origin = (() => {
    try { return ctx.webServer.getOrigin(); } catch { return undefined; }
  })();

  /** Reject cross-origin browser peers on both routes. */
  const sameOrigin = (req) => {
    const declared = req.headers.origin ?? req.headers.referer;
    return !(origin && typeof declared === 'string' && !declared.startsWith(origin));
  };

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/zzz-fairy/balance',
    handler: async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end();
        return;
      }
      if (!sameOrigin(req)) { res.writeHead(403); res.end('forbidden'); return; }
      try {
        const client = {
          version: '0.2.1-rc.2',
          locale: 'zh',
          timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
        };
        const balance = await ctx.deepseekAccount.getBalance(client);
        reply(res, 200, { ok: true, balance: balance ?? null });
      } catch (error) {
        reply(res, 200, {
          ok: false,
          error: String(error && error.message ? error.message : error).slice(0, 300),
        });
      }
    },
  }), 'zzz-fairy-skin: account balance route');

  /* GET /zzz-fairy/tts/info — which voice is wired, for the UI tooltip. */
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/zzz-fairy/tts/info',
    handler: async (req, res) => {
      const config = await ttsConfig();
      reply(res, 200, {
        ok: true,
        provider: config.provider,
        voice: config.provider === 'sapi' ? SAPI_VOICE : 'Fairy (GPT-SoVITS)',
        maxChars: MAX_SPEECH_CHARS,
      });
    },
  }), 'zzz-fairy-skin: tts info route');

  /* POST /zzz-fairy/tts {text} -> audio/wav */
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/zzz-fairy/tts',
    handler: (req, res) => {
      if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
      if (!sameOrigin(req)) { res.writeHead(403); res.end('forbidden'); return; }
      let body = '';
      let size = 0;
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > 64 * 1024) { req.destroy(); return; }
        body += chunk;
      });
      req.on('end', async () => {
        let config = null;
        try {
          let parsed;
          try { parsed = JSON.parse(body || '{}'); } catch { parsed = {}; }
          const text = speechText(parsed.text);
          if (!text) { reply(res, 400, { ok: false, error: 'empty text' }); return; }
          config = await ttsConfig();
          /* Neural TTS is CPU-bound here: keep the spoken part to a few
             sentences so a long reply still answers in seconds. */
          const spoken = config.provider === 'gpt-sovits' ? truncateForSpeech(text, 260) : text;
          const audio = config.provider === 'gpt-sovits'
            ? await voiceLifecycle.run(config, () => gptSovitsSpeak(config, spoken), () => res.destroyed)
            : await sapiSpeak(spoken, SAPI_VOICE);
          if (res.destroyed) return;
          res.writeHead(200, {
            'content-type': 'audio/wav',
            'cache-control': 'no-store',
            'content-length': audio.length,
          });
          res.end(audio);
        } catch (error) {
          if (res.destroyed) return;
          reply(res, 500, {
            ok: false,
            error: String(error && error.message ? error.message : error).slice(0, 300),
          });
        }
      });
    },
  }), 'zzz-fairy-skin: tts route');

  /* Boot animation assets: the opening video and its backdrop still. */
  for (const name of ['boot.mp4', 'boot-bg.png']) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: `/zzz-fairy/${name}`,
      handler: (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
        serveAsset(req, res, name).catch(() => { try { res.writeHead(500); res.end(); } catch (e) { /* gone */ } });
      },
    }), `zzz-fairy-skin: asset ${name}`);
  }
}
