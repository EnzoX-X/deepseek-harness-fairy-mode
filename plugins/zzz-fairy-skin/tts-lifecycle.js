import { spawn } from 'node:child_process';

export function createVoiceLifecycle(options = {}) {
  const request = options.fetch || fetch;
  const wait = options.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const now = options.now || Date.now;
  const launch = options.launch || (file => new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    delete env.NODE_OPTIONS;
    const child = spawn('wscript.exe', [file], { detached: true, windowsHide: true, stdio: 'ignore', env });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); resolve(); });
  }));
  let starting = null;
  let tail = Promise.resolve();
  let pending = 0;
  async function ready(config) {
    try {
      const response = await request(new URL('/fairy/health', config.url), { signal: AbortSignal.timeout(1500) });
      const status = response.status;
      await response.body?.cancel();
      // Old API has no health route; let synthesis work until it is restarted.
      return response.ok || status === 404;
    } catch { return false; }
  }
  async function ensure(config) {
    if (!config.launcher || await ready(config)) return;
    const url = new URL(config.url);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('仅允许自动启动本机语音服务');
    if (!starting) {
      starting = (async () => {
        await launch(config.launcher);
        const launchedAt = now();
        let retried = false;
        const deadline = now() + 120000;
        do {
          await wait(1000);
          if (await ready(config)) return;
          // The first launcher can meet the old process during graceful exit.
          // A single retry is safe: the launcher holds a per-service mutex.
          if (!retried && now() - launchedAt > 10000) {
            retried = true;
            await launch(config.launcher);
          }
        } while (now() < deadline);
        throw new Error('语音服务启动超过 120 秒，请检查语音日志');
      })().finally(() => { starting = null; });
    }
    await starting;
  }
  return {
    async run(config, synthesize, cancelled = () => false) {
      if (pending >= 3) throw new Error('语音请求较多，请等待当前朗读结束');
      pending++;
      const result = tail.then(async () => {
        if (cancelled()) throw new Error('语音请求已取消');
        await ensure(config);
        if (cancelled()) throw new Error('语音请求已取消');
        return synthesize();
      });
      tail = result.then(() => undefined, () => undefined);
      try { return await result; } finally { pending--; }
    },
  };
}
