window.__ModuleLoader__.load({
  id: '@local/dsh-zzz-fairy-skin',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const LAYER_SOURCE = 'zzz-fairy-skin';
    const LOCALE_NS = 'zzzFairySkin';

    /* OPT-01-SIDEBAR-BREAKPOINT
       DSH switches to its compact rail below 1024 CSS px. On Windows with
       display scaling that makes a 1400px-wide window collapse much earlier
       than the reference layout. Keep the full sidebar down to 900 CSS px,
       then hand control back to DSH's own narrow-mode toggle. */
    const OPT_01_SIDEBAR_BREAKPOINT = 900;
    const DSH_SIDEBAR_BREAKPOINT = 1024;

    function installOpt01SidebarBreakpoint() {
      let frame = null;
      let resizeObserver = null;
      let mountObserver = null;
      let settleTimer = null;
      let currentZone = null;

      const zoneFor = (width) => {
        if (width < OPT_01_SIDEBAR_BREAKPOINT) return 'compact';
        if (width < DSH_SIDEBAR_BREAKPOINT) return 'fairy-expanded';
        return 'native';
      };

      const reconcile = () => {
        if (!frame || !frame.isConnected || currentZone === 'native') return;
        const collapsed = frame.hasAttribute('data-sidebar-collapsed');
        const shouldCollapse = currentZone === 'compact';
        if (collapsed === shouldCollapse) return;
        const toggle = frame.querySelector('._2H3hWW_toggle');
        if (toggle instanceof HTMLElement) toggle.click();
      };

      const measure = () => {
        if (!frame) return;
        const nextZone = zoneFor(frame.getBoundingClientRect().width);
        if (nextZone === currentZone) return;
        currentZone = nextZone;
        clearTimeout(settleTimer);
        /* Let the shell finish its own 1024px response before correcting it. */
        settleTimer = setTimeout(reconcile, 80);
      };

      const attach = () => {
        frame = document.querySelector('.BynINW_frame');
        if (!frame) return false;
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(frame);
        measure();
        return true;
      };

      if (!attach()) {
        mountObserver = new MutationObserver(() => {
          if (attach()) {
            mountObserver.disconnect();
            mountObserver = null;
          }
        });
        mountObserver.observe(document.documentElement, { childList: true, subtree: true });
      }

      return () => {
        clearTimeout(settleTimer);
        resizeObserver?.disconnect();
        mountObserver?.disconnect();
      };
    }

    function installMovingScan() {
      const panels = new Map();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      let disposed = false;
      const visible = () => {
        for (const item of panels.values()) {
          item.clip.hidden = reduced.matches || document.hidden;
          if (!item.animation) continue;
          if (item.clip.hidden) item.animation.pause();
          else { item.animation.play(); item.animation.startTime = 0; }
        }
      };
      const layout = () => {
        for (const [panel, item] of panels) {
          const box = panel.getBoundingClientRect();
          Object.assign(item.clip.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' });
          const key = [box.top, window.innerHeight].join(':');
          if (item.key === key) continue;
          item.key = key;
          item.animation?.cancel();
          const from = 'translateY(' + (-box.top - 45) + 'px)';
          const to = 'translateY(' + (window.innerHeight + 45 - box.top) + 'px)';
          item.animation = item.band.animate([
            { transform: from, offset: 0 }, { transform: to, offset: .8 }, { transform: to, offset: 1 },
          ], { duration: 10000, iterations: Infinity, easing: 'linear' });
          item.animation.startTime = 0;
        }
        visible();
      };
      const resize = new ResizeObserver(layout);
      const reconcile = () => {
        if (disposed) return;
        for (const [panel, item] of panels) if (!panel.isConnected) {
          item.animation?.cancel(); resize.unobserve(panel); item.clip.remove(); panels.delete(panel);
        }
        let added = false;
        for (const panel of document.querySelectorAll('.Dc7zOa_root, ._2H3hWW_root')) {
          if (panels.has(panel)) continue;
          const clip = document.createElement('div');
          clip.className = 'zzz-scan-clip'; clip.setAttribute('aria-hidden', 'true');
          const band = document.createElement('div'); band.className = 'zzz-moving-scan';
          clip.appendChild(band); panel.prepend(clip);
          panels.set(panel, { clip, band }); resize.observe(panel); added = true;
        }
        if (added) layout();
      };
      const mounts = new MutationObserver(reconcile);
      mounts.observe(document.body, { childList: true, subtree: true });
      reconcile();
      window.addEventListener('resize', layout);
      document.addEventListener('visibilitychange', visible);
      reduced.addEventListener('change', visible);
      return () => {
        disposed = true; mounts.disconnect(); resize.disconnect();
        window.removeEventListener('resize', layout);
        document.removeEventListener('visibilitychange', visible);
        reduced.removeEventListener('change', visible);
        for (const item of panels.values()) { item.animation?.cancel(); item.clip.remove(); }
        panels.clear();
      };
    }

    // HDD / Fairy palette - deep navy + electric blue, matching the reference
    // video's HDD system screen and orb mascot. Values follow light/dark setting.
    const TOKENS = {
      '--dsw-alias-bg-base': { light: '#eef2fa', dark: '#081320' },
      '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#0c192a' },
      '--dsw-alias-bg-layer-2': { light: '#f4f7fd', dark: '#112035' },
      '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#14233a' },
      '--dsw-alias-border-l1': { light: '#d0daec', dark: '#1b2c44' },
      '--dsw-alias-border-l2': { light: '#aebdd8', dark: '#294266' },
      '--dsw-alias-brand-primary': { light: '#2563eb', dark: '#2f6bff' },
      '--dsw-alias-label-primary': { light: '#0d1526', dark: '#dbe6f5' },
      '--dsw-alias-label-secondary': { light: '#55647f', dark: '#7f93b8' },
      '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#ff5c5c' },
      '--dsw-alias-state-idle-primary': { light: '#94a3b8', dark: '#5a6b8c' },
      '--dsw-alias-state-success-primary': { light: '#059669', dark: '#3ddc97' },
      '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#ffb020' },
      '--dsw-specific-sidebar-fill': { light: '#e8edf8', dark: '#080f1c' },
    };

    const SKIN_CSS = `
:root {
  --dsw-focus-ring-color: var(--dsw-alias-brand-primary);
  --zzz-orb-halo: #2f6bff;
}
body {
  --dsh-scrollbar-thumb: color-mix(in srgb, var(--dsw-alias-label-secondary) 42%, transparent);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-brand-primary);
}
::selection { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, transparent); }

/* very faint CRT scanlines: barely visible in normal viewing */
.zzz-scanlines {
  position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; opacity: 0.004;
  background: repeating-linear-gradient(0deg,
    var(--dsw-alias-label-primary) 0px, var(--dsw-alias-label-primary) 1px,
    transparent 1px, transparent 4px);
}

/* sidebar brand wordmark */
/* The sidebar brand row clips at ~23px of usable height (a 24px box whose
   overflow is hidden), so the stacked lockup is budgeted to 21.5px:
   12px name + 1.5px gap + 8px tagline. Anything taller loses the tagline's
   bottom strokes. */
.zzz-brand-name {
  display: inline-flex; align-items: center; gap: 0.4em;
  justify-content: flex-start; text-align: left;
  height: 24px; min-width: 0; max-width: 100%;
  color: var(--dsw-alias-label-primary); user-select: none;
}
.zzz-brand-text {
  display: inline-flex; flex-direction: column; align-items: flex-start;
  justify-content: center; line-height: 1; gap: 1.5px; min-width: 0;
}
.zzz-brand-text b {
  font-family: var(--dsw-font-family-brand, "Montserrat", "Segoe UI", system-ui, sans-serif);
  font-style: italic; font-weight: 800; font-size: 12px; line-height: 1;
  letter-spacing: 0.01em; white-space: nowrap;
}
.zzz-brand-text small {
  font-size: 8px; letter-spacing: 0.01em; line-height: 1; white-space: nowrap;
  color: var(--dsw-alias-label-secondary);
}

/* The wrapper never moves: only the SVG's named internal layers animate. */
.zzz-orb-pulse { display: inline-flex; border-radius: 50%; filter: drop-shadow(0 0 14px rgba(84,114,255,.22)); }

/* orb internals: the blade ring spins clockwise, the inner disc breathes */
@keyframes zzz-orb-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes zzz-orb-breath { 0%, 100% { transform: scale(0.94); } 50% { transform: scale(1.06); } }
@keyframes zzz-orb-wave {
  0% { transform: scale(1); opacity: 0; }
  12% { opacity: 0.52; }
  100% { transform: scale(1.45); opacity: 0; }
}
/* view-box fixes every transform origin at (50,50), not the blades' bounding box. */
.zzz-orb-spin, .zzz-orb-inner, .zzz-orb-wave { transform-box: view-box; transform-origin: 50% 50%; }
.zzz-orb-spin { animation: zzz-orb-rot 16s linear infinite; }
.zzz-orb-inner { animation: zzz-orb-breath 4.6s ease-in-out infinite; }
.zzz-orb-wave { fill: none; stroke: #f2f7ff; stroke-width: 2.8; opacity: 0;
  animation: zzz-orb-wave 2s ease-out infinite; }
.zzz-orb-wave-halo { stroke-width: 5.5; stroke-opacity: 0.45; }
/* Alternating accents: short-circuit burst at 3s, sliced glitch at 6.6s. */
@keyframes zzz-orb-flash {
  0%, 41.66%, 49.3%, 100% { filter: brightness(1); }
  41.67% { filter: brightness(1.95) drop-shadow(0 0 2.8px #bde9ff); }
  42.6% { filter: brightness(0.65); }
  44% { filter: brightness(1.7) drop-shadow(0 0 2px #a8dfff); }
  44.8% { filter: brightness(0.52); }
  45.9% { filter: brightness(2.05) drop-shadow(0 0 3px #c7efff); }
  46.5% { filter: brightness(0.72); }
  47.5% { filter: brightness(1.65) drop-shadow(0 0 1.8px #a8dfff); }
  48.05% { filter: brightness(0.85); }
}
@keyframes zzz-orb-glitch {
  0%, 91.66%, 93.62%, 100% { filter: none; }
  91.67% { filter: var(--zzz-glitch-filter) brightness(1.5); }
  92.15% { filter: var(--zzz-glitch-soft-filter) brightness(1.25); }
  92.65% { filter: var(--zzz-glitch-filter) brightness(1.4); }
  93.15% { filter: var(--zzz-glitch-soft-filter); }
}
.zzz-orb-light { animation: zzz-orb-flash 7.2s steps(1, end) infinite; }
.zzz-orb-signal { animation: zzz-orb-glitch 7.2s steps(1, end) infinite; }
/* UI brand marks use the same geometry, frozen at its neutral pose. */
.zzz-orb-static .zzz-orb-spin,
.zzz-orb-static .zzz-orb-inner,
.zzz-orb-static .zzz-orb-light,
.zzz-orb-static .zzz-orb-signal { animation: none; transform: none; filter: none; }
.zzz-orb-static .zzz-orb-wave { display: none; animation: none; }
@media (prefers-reduced-motion: reduce) {
  .zzz-orb-spin, .zzz-orb-inner, .zzz-orb-wave,
  .zzz-orb-light, .zzz-orb-signal { animation: none; }
  .zzz-orb-pulse { animation: none; }
}

/* Fixed sidebar mascot: ~62% of the sidebar width, centred, above the footer.
   Only the box around the artwork is sized here; the artwork itself and its
   animations are untouched. */
.zzz-orb-corner {
  position: fixed; left: 0; bottom: 98px; z-index: 2147483644;
  width: var(--dsh-windows-sidebar-width, 280px);
  pointer-events: none; opacity: 0.88;
  display: flex; align-items: center; justify-content: center;
}
.zzz-orb-corner-inner {
  display: flex; width: 56%; max-width: 164px;
}
.zzz-orb-corner-inner > svg { width: 100%; height: auto; }
.zzz-orb-corner-halo { display: none; }
@media (prefers-reduced-motion: reduce) {
  .zzz-orb-corner-inner, .zzz-orb-corner-halo { animation: none; }
}
@media (max-height: 780px) {
  .zzz-orb-corner { display: none; }
}

/* composer cost chip (real account balance) */
.zzz-cost-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; line-height: 1; white-space: nowrap;
  color: var(--dsw-alias-label-secondary);
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  border-radius: 999px; padding: 4px 10px;
}
.zzz-cost-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #ff5c5c; box-shadow: 0 0 6px rgba(255, 92, 92, 0.7);
  flex: 0 0 auto;
}
.zzz-cost-chip b { color: var(--dsw-alias-brand-primary); font-weight: 600; }
.zzz-cost-today { font-style: normal; margin-left: 8px; color: var(--dsw-alias-label-secondary); }
.zzz-cost-today::before { content: '·'; margin-right: 6px; opacity: 0.55; }
.zzz-cost-chip.is-failed .zzz-cost-dot { background: var(--dsw-alias-state-idle-primary); box-shadow: none; }

/* boot greeting overlay (HDD system screen) */
.zzz-boot {
  position: fixed; inset: 0; z-index: 2147483645;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #e6eefc;
  background:
    radial-gradient(60% 55% at 50% 38%, rgba(60, 110, 255, 0.22), transparent 62%),
    radial-gradient(120% 110% at 50% 0%, #0e1a38, #05080f 72%);
  font-family: ui-monospace, "Cascadia Mono", Consolas, "Segoe UI Mono", monospace;
  opacity: 1; transition: opacity 0.45s ease;
}
.zzz-boot.leaving { opacity: 0; }
.zzz-boot-web { position: absolute; inset: 0; width: 100%; height: 100%; }
.zzz-boot-core { position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.zzz-boot-title {
  font-family: var(--dsw-font-family-brand, "Montserrat", "Segoe UI", system-ui, sans-serif);
  font-size: 54px; font-weight: 800; letter-spacing: 0.3em; text-indent: 0.3em;
  color: #ffffff;
  text-shadow: 3px 0 rgba(77, 141, 255, 0.9), -3px 0 rgba(130, 225, 255, 0.6);
}
.zzz-boot-sub {
  font-size: 11px; letter-spacing: 0.4em; text-indent: 0.4em;
  text-transform: uppercase; color: rgba(230, 238, 252, 0.55);
}
.zzz-boot-lines { margin-top: 6px; min-height: 108px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.zzz-boot-line { opacity: 0; transform: translateX(-6px); transition: opacity 0.3s ease, transform 0.3s ease; color: #dbe7ff; }
.zzz-boot-line.on { opacity: 1; transform: none; }
.zzz-boot-caret { color: #4d8dff; margin-right: 8px; }
.zzz-boot-track {
  width: 100%; height: 4px; margin-top: 10px;
  background: rgba(77, 141, 255, 0.12); border: 1px solid rgba(77, 141, 255, 0.35);
}
.zzz-boot-bar { height: 100%; background: linear-gradient(90deg, #4d8dff, #8fd0ff); transition: width 0.45s ease; }
.zzz-boot-skip {
  position: absolute; right: 26px; bottom: 22px;
  font-size: 11px; letter-spacing: 0.3em; color: rgba(230, 238, 252, 0.5);
}

/* ---- opening: video -> frame+Fairy cross-fade in -> frame out -> dock ---- */
.zzz-boot-overlay { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; }
.zzz-boot-overlay > * { pointer-events: auto; }
.zzz-boot-video-wrap {
  position: fixed; inset: 0; z-index: 2147483645;
  display: flex; align-items: center; justify-content: center;
  background: #000; cursor: pointer;
  opacity: 1;
}
.zzz-boot-video-wrap.is-leaving { opacity: 1; }
.zzz-boot-video { display: block; width: 100%; height: 100%; object-fit: cover; }
.zzz-boot-video-skip {
  position: absolute; right: 26px; bottom: 22px;
  font-size: 11px; letter-spacing: 0.3em; color: rgba(230, 238, 252, 0.45);
}

.zzz-boot-hero {
  position: fixed; inset: 0; z-index: 2147483646;
  background: transparent; overflow: hidden; cursor: pointer;
  animation: zzz-boot-hero-in 1.05s ease both;
}
/* Cancel the filled keyframes first, otherwise the animation keeps opacity at 1
   and the fade-out transition never runs. */
.zzz-boot-hero.is-leaving { animation: none; opacity: 0; transition: opacity 0.24s ease; }
@keyframes zzz-boot-hero-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.zzz-boot-hero-bg {
  position: absolute; inset: 0;
  /* Longhands, not the shorthand: an invalid shorthand drops the image too. */
  background-color: #000;
  background-image: url("/zzz-fairy/boot-bg.png?v=1");
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 1; transform: scale(1.02);
  transition: opacity 1.2s ease, transform 1.8s ease;
}
/* Fade the frame while Fairy moves, revealing the live app continuously. */
.zzz-boot-hero.is-bgout .zzz-boot-hero-bg { opacity: 0; transform: scale(1.06); }
.zzz-boot-hero-orb {
  position: absolute; left: 50%; top: 50%;
  /* Fallback landing when the seat cannot be measured (see BootHero). */
  --zzz-dock-x: calc(var(--dsh-windows-sidebar-width, 280px) / 2 - 50vw);
  --zzz-dock-y: calc(100vh - 180px - 50vh);
  transform: translate(-50%, -50%) translate(0px, 0px) scale(1);
  will-change: transform;
  transition: transform 1.2s cubic-bezier(0.45, 0.05, 0.2, 1);
}
.zzz-boot-hero.is-docked .zzz-boot-hero-orb {
  transform: translate(-50%, -50%) translate(var(--zzz-dock-x), var(--zzz-dock-y)) scale(0.63);
  /* The sidebar orb carries no glow: fade ours out so the swap is invisible. */
  filter: drop-shadow(0 0 0 rgba(47, 107, 255, 0));
}
/* BOOT-CONTINUOUS: hide the real seat until the aligned handoff. */
body:has(.zzz-boot-overlay) .zzz-orb-corner { visibility: hidden; }
body:has(.zzz-boot-hero.is-leaving) .zzz-orb-corner { visibility: visible; }
.zzz-boot-greeting {
  position: absolute; top: calc(50% + 160px); left: 12%; right: 12%;
  text-align: center; color: #dbe6f5; font-size: 16px; line-height: 1.7;
  transition: opacity .4s ease; pointer-events: auto;
  border: 0; background: transparent; cursor: pointer; font-family: inherit;
}
.zzz-boot-hero.is-docked .zzz-boot-greeting { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .zzz-boot-hero, .zzz-boot-hero-orb, .zzz-boot-hero-bg { animation: none; transition: none; }
}
@media (prefers-reduced-motion: reduce) {
  .zzz-orb-pulse { animation: none; }
  .zzz-boot-line { transition: none; }
}

/* =====================================================================
   Main surface: sidebar / hero / conversation.

   The selectors below are the CSS-module class names of THIS DSH build.
   They are the only structural hooks the shell exposes, so they are kept
   in one block: if a DSH update renames them, this is the single place
   to fix. Artwork, Orb geometry and every keyframe stay untouched.
   ===================================================================== */

/* The theme defines its surface tokens on body[data-ds-dark-theme], so the
   overrides have to sit on the same element with the same specificity. */
body,
body[data-ds-dark-theme] {
  --zzz-line: #1b2c44;                          /* hairline separators */
  --zzz-panel: #0c192a;                         /* raised panel */
  --zzz-selected: rgba(88, 120, 170, 0.15);     /* quiet selection fill */
  --zzz-btn: rgba(34, 60, 96, 0.55);            /* new-session fill */
  --zzz-btn-hover: rgba(48, 80, 126, 0.65);
  --dsw-specific-bubble: #16273d;               /* user message bubble */
  --dsw-specific-input-major: #0b1728;          /* composer panel */
  --dsh-content-font-size: 14px;
  --dsh-content-font-delta: 2px;                /* 22px + 2px = 24px line box */
}

/* ---- frame ---- */
.BynINW_centerCol { border-left: 0.5px solid var(--zzz-line); }
.BynINW_sidebarCol { border-right: 0.5px solid var(--zzz-line); }

/* ---- sidebar ---- */
/* One shared content column for hero, messages and the composer: 68% of the
   column, never wider than 760px. Left as a root-level custom property so the
   shell's own width-drag (which writes the same property inline) still wins. */
.Dc7zOa_root { --dsh-chat-user-width: clamp(560px, 68%, 760px); }

._2H3hWW_newSession {
  background: var(--zzz-btn);
  border: 0.5px solid var(--zzz-line);
  border-radius: 5px;
  height: 36px;
  font-size: 13.5px;
  box-shadow: none;
}
._2H3hWW_newSession:hover { background: var(--zzz-btn-hover); }
._2H3hWW_newSession:disabled { background: var(--zzz-btn); opacity: 0.6; }

._2H3hWW_panelRow._2H3hWW_panelActive { background: var(--zzz-selected); }
.hIlkoa_sessionRow.hIlkoa_selected {
  background: var(--zzz-selected);
  box-shadow: inset 0 0 0 0.5px rgba(120, 150, 200, 0.16);
}
._2H3hWW_regionArea { padding-bottom: 126px; }

/* ---- empty session: small mark + compact title, composer right below ---- */
.Hqq-bq_stack {
  gap: 26px;
  max-width: min(var(--dsh-composer-card-max-width, 760px), 760px);
}
.Hqq-bq_headline { font-size: 22px; line-height: 30px; gap: 8px; font-weight: 500; }
.Hqq-bq_titleGroup { gap: 6px; }
.Hqq-bq_body { gap: 14px; }
.Hqq-bq_workspaceRow { padding-left: 2px; }

/* ---- composer: dark panel, hairline border, moderate radius ---- */
.RlGAzG_card {
  background: var(--dsw-specific-input-major);
  border-radius: 10px;
  box-shadow: 0 0 0 0.5px var(--zzz-line), 0 10px 26px rgba(4, 10, 20, 0.45);
}
.RlGAzG_hero .RlGAzG_input { min-height: 48px; }

/* ---- conversation ---- */
/* MEMORY-01: static grids; narrow transform-only scan layers below content. */
.Dc7zOa_root, ._2H3hWW_root { isolation: isolate; }
.Dc7zOa_root {
  --fairy-grid-opacity: .04;
  background-image:
    linear-gradient(to right, rgba(115,155,190,var(--fairy-grid-opacity)) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(115,155,190,var(--fairy-grid-opacity)) 1px, transparent 1px);
  background-size: 40px 40px; background-position: 0 0; background-attachment: fixed;
}
._2H3hWW_root {
  --fairy-sidebar-grid-opacity: .025;
  background-image:
    linear-gradient(to right, rgba(115,155,190,var(--fairy-sidebar-grid-opacity)) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(115,155,190,var(--fairy-sidebar-grid-opacity)) 1px, transparent 1px);
  background-size: 40px 40px; background-position: 0 0; background-attachment: fixed;
}
.zzz-scan-clip { position: fixed; overflow: hidden; z-index: -1; pointer-events: none; contain: paint; }
.zzz-moving-scan { position: absolute; top: 0; left: 0; width: 100%; height: 45px;
  background: linear-gradient(to bottom, transparent, rgba(220,235,250,.09) 50%, transparent); }
/* END MEMORY-01 */
.cJsG2q_bubble { border-radius: 10px; padding: 8px 13px; }
.cJsG2q_compactionRow { opacity: 0.9; }

/* ---- voice replies ---- */
/* OPT-VOICE-WAVE: decorative loop, gated by actual audio playback. */
.zzz-voice-wave { display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 6px; flex: none; color: #8daecb; }
.zzz-voice-wave { position: relative; width: 62px; box-sizing: border-box; }
.zzz-voice-wave::before { content: ''; position: absolute; left: 6px; right: 6px; height: 1px; background: currentColor; opacity: .65; }
.zzz-voice-wave i { display: none; width: 2px; height: 18px; border-radius: 2px; background: currentColor; }
.zzz-voice-wave.is-audible::before { display: none; }
.zzz-voice-wave.is-audible i { display: block; flex: none; animation: zzz-voice-wave-loop 1.2s ease-in-out infinite; animation-delay: var(--wave-delay); }
@keyframes zzz-voice-wave-loop { 0%,100% { transform: scaleY(.25); } 25% { transform: scaleY(.85); } 55% { transform: scaleY(.4); } 75% { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .zzz-voice-wave i { animation: none; } .zzz-voice-wave.is-audible { color: #c5e1f5; } }
.zzz-voice-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  height: 26px; padding: 0 7px; gap: 5px;
  border: 0.5px solid transparent; border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  cursor: pointer; transition: background-color .12s, color .12s, border-color .12s;
}
.zzz-voice-toggle:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.zzz-voice-toggle.is-on {
  color: #7fb2ff; border-color: rgba(90, 140, 220, 0.45); background: rgba(40, 72, 120, 0.3);
}
.zzz-voice-icon { display: block; }
.zzz-voice-action {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; padding: 0; border: none; border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer;
  transition: background-color .12s, color .12s;
}
.zzz-voice-action:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.zzz-voice-action.is-playing { color: #7fb2ff; }
.zzz-voice-action.is-error { color: #ff7a7a; }
.zzz-voice-action.is-playing .zzz-voice-icon { animation: zzz-voice-pulse 1.2s ease-in-out infinite; }
@keyframes zzz-voice-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .zzz-voice-action.is-playing .zzz-voice-icon { animation: none; }
}
`;

    /** Deterministic blue wireframe web (the HDD system background). */
    function buildWeb() {
      let seed = 1337;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const C = 200;
      const rings = [58, 118, 178];
      const pts = rings.map((r, ri) => {
        const n = 10 + ri * 4;
        const off = ri * 0.35;
        const ring = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + off + (rnd() - 0.5) * 0.12;
          const rr = r + (rnd() - 0.5) * 10;
          ring.push([C + Math.cos(a) * rr, C + Math.sin(a) * rr]);
        }
        return ring;
      });
      const segs = [];
      const line = (a, b) => segs.push('M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1));
      pts.forEach((ring) => ring.forEach((p, i) => line(p, ring[(i + 1) % ring.length])));
      pts[0].forEach((p) => line([C, C], p));
      for (let ri = 0; ri < pts.length - 1; ri++) {
        const a = pts[ri], b = pts[ri + 1];
        a.forEach((p, i) => { line(p, b[i % b.length]); line(p, b[(i + 3) % b.length]); });
      }
      return segs.join('');
    }
    const WEB_PATH = buildWeb();

    const BOOT_LINES = ['lineBoot', 'lineInit', 'lineNormal', 'lineGreet', 'lineStandby'];

    /**
     * Geometry traced from the supplied full-size logo reference.
     * All inner rings are complete; the lower-right disc is translucent gloss.
     */
    function Orb({ size = 24, pulse = false, staticMark = false }) {
      const uid = React.useId ? React.useId().replace(/:/g, '') : 'fairy';
      const glow = 'fairy-glow-' + uid;
      const shade = 'fairy-shade-' + uid;
      const blue = 'fairy-blue-' + uid;
      const wave = 'fairy-wave-' + uid;
      const mist = 'fairy-mist-' + uid;
      const glitch = 'fairy-glitch-' + uid;
      const softGlitch = 'fairy-glitch-soft-' + uid;
      /* Clip the actual artwork into horizontal rectangles, then translate each.
         No displacement map: every tear has a straight horizontal cut. */
      const slices = [
        [0, 12, 0], [12, 5, -7], [17, 7, 11], [24, 4, -14],
        [28, 8, 5], [36, 4, 16], [40, 7, -11], [47, 4, 14],
        [51, 8, -6], [59, 5, 12], [64, 7, -15], [71, 4, 8],
        [75, 8, -10], [83, 5, 6], [88, 12, 0],
      ];
      const signalFilter = (id, strength) => h('filter', {
        id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse',
        x: -30, y: -5, width: 160, height: 110, colorInterpolationFilters: 'sRGB',
      },
        slices.flatMap(([y, height, dx], i) => [
          h('feFlood', { key: 'mask' + i, x: -25, y, width: 150, height,
            floodColor: '#fff', result: 'mask' + i }),
          h('feComposite', { key: 'cut' + i, in: 'SourceGraphic', in2: 'mask' + i,
            operator: 'in', result: 'cut' + i }),
          h('feOffset', { key: 'move' + i, in: 'cut' + i, dx: dx * strength,
            dy: 0, result: 'slice' + i }),
        ]),
        /* A faint icy-blue echo on a few slices gives electrical edges. */
        [3, 5, 9].flatMap(i => [
          h('feColorMatrix', { key: 'tint' + i, in: 'slice' + i, type: 'matrix',
            values: '0 0 0 0 0.65  0 0 0 0 0.88  0 0 0 0 1  0 0 0 .4 0',
            result: 'tint' + i }),
          h('feOffset', { key: 'echo' + i, in: 'tint' + i, dx: 4 * strength,
            result: 'echo' + i }),
        ]),
        h('feMerge', null,
          slices.map((_, i) => h('feMergeNode', { key: i, in: 'slice' + i })),
          [3, 5, 9].map(i => h('feMergeNode', { key: 'echo' + i, in: 'echo' + i }))));
      const svg = h('svg', {
        className: staticMark ? 'zzz-orb-static' : undefined,
        viewBox: '0 0 100 100', width: size, height: size, 'aria-hidden': true,
        style: { display: 'block', flex: '0 0 auto', overflow: 'visible',
          '--zzz-glitch-filter': 'url(#' + glitch + ')',
          '--zzz-glitch-soft-filter': 'url(#' + softGlitch + ')' },
      },
        h('defs', null,
          h('radialGradient', { id: blue },
            h('stop', { offset: '0%', stopColor: '#3445d4' }),
            h('stop', { offset: '100%', stopColor: '#2e38bc' })),
          h('radialGradient', { id: shade },
            h('stop', { offset: '76%', stopColor: '#25265e' }),
            h('stop', { offset: '90%', stopColor: '#2c2b70' }),
            h('stop', { offset: '100%', stopColor: '#252568' })),
          h('filter', { id: glow, x: '-50%', y: '-50%', width: '200%', height: '200%' },
            h('feGaussianBlur', { stdDeviation: 1.4 })),
          h('filter', { id: wave, x: '-50%', y: '-50%', width: '200%', height: '200%' },
            h('feGaussianBlur', { stdDeviation: 0.9 })),
          h('filter', { id: mist, x: '-80%', y: '-80%', width: '260%', height: '260%' },
            h('feGaussianBlur', { stdDeviation: 2.1 })),
          signalFilter(glitch, 1), signalFilter(softGlitch, -0.55)),
        h('circle', { className: 'zzz-orb-wave zzz-orb-wave-halo', cx: 50, cy: 50, r: 46,
          filter: 'url(#' + mist + ')' }),
        h('circle', { className: 'zzz-orb-wave', cx: 50, cy: 50, r: 46,
          filter: 'url(#' + wave + ')' }),
        h('circle', { cx: 50, cy: 50, r: 46, fill: 'none', stroke: '#9fc8ff',
          strokeWidth: 1.8, opacity: 0.32, filter: 'url(#' + glow + ')' }),
        h('g', { className: 'zzz-orb-signal' },
        h('g', { className: 'zzz-orb-light' },
        h('circle', { cx: 50, cy: 50, r: 46, fill: 'url(#' + blue + ')' }),
        h('g', { className: 'zzz-orb-spin' },
          h('circle', { cx: 50, cy: 50, r: 35.2, fill: '#24256a' }),
          [8, 98, 188, 278].map(deg => h('path', { key: deg,
            d: 'M 40 18 L 50 9.5 L 60 18 Z',
            fill: '#24256a', transform: 'rotate(' + deg + ' 50 50)' }))),
        h('circle', { cx: 50, cy: 50, r: 35.2, fill: 'url(#' + shade + ')' }),
        h('g', { className: 'zzz-orb-inner' },
          h('circle', { cx: 50, cy: 50, r: 29.6, fill: '#f0f1f5' }),
          h('circle', { cx: 50, cy: 50, r: 20.1, fill: '#a0afe0' }),
          h('circle', { cx: 50, cy: 50, r: 13.9, fill: '#2e78c2', stroke: '#77bae7', strokeWidth: 0.5 }),
          h('circle', { cx: 50, cy: 50, r: 9.35, fill: '#303075' })),
        h('circle', { cx: 50, cy: 50, r: 46, fill: 'none', stroke: '#e3efff', strokeWidth: 0.65 }))),
        /* Gloss is a sibling of both animated groups; its coordinates and radius stay fixed. */
        h('circle', { className: 'zzz-orb-gloss', cx: 61.7, cy: 62.7, r: 7.2,
          fill: '#ffffff', opacity: 0.53 })
      );
      return pulse ? h('span', { className: 'zzz-orb-pulse', 'aria-hidden': true }, svg) : svg;
    }

    /** Sidebar wordmark: bold italic name over the model subtitle, matching the reference. */
    function BrandName() {
      return h('span', { className: 'zzz-brand-name' },
        h('span', { className: 'zzz-brand-text' },
          h('b', null, 'Fairy'),
          h('small', null, 'Ⅲ型总序式集成泛用人工智能')));
    }

    /** Persistent sidebar status core: restrained so it supports, rather than dominates, navigation. */
    function FloatingOrb() {
      return h('div', { className: 'zzz-orb-corner', 'aria-hidden': true },
        h('span', { className: 'zzz-orb-corner-halo' }),
        h('span', { className: 'zzz-orb-corner-inner' }, h(Orb, { size: 160 })));
    }

    /* ---------------- real account cost chip (剩余电费) ---------------- */

    /** Wallet list out of whatever envelope the balance remote returns. */
    function pickWallets(res) {
      const candidates = [res, res && res.value, res && res.value && res.value.balance, res && res.balance];
      for (const c of candidates) {
        if (!c) continue;
        if (Array.isArray(c)) return c;
        if (typeof c === 'object' && c.status === 'ready' && Array.isArray(c.value)) return c.value;
      }
      return null;
    }

    function formatMoney(raw) {
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      return n.toFixed(2);
    }

    /* ---- daily cost = (balance at the most recent 12:00) - (current balance) ---- */

    const DAILY_KEY = 'zzz-fairy-daily-balance-v1';

    /** ISO timestamp of the most recent local midnight at or before now. */
    function lastMidnightBoundary(now) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }

    function readDaily() {
      try {
        const raw = window.localStorage.getItem(DAILY_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.boundary !== 'string' || !Number.isFinite(Number(parsed.balance))) return null;
        return { boundary: parsed.boundary, balance: Number(parsed.balance) };
      } catch (e) {
        return null;
      }
    }

    function writeDaily(value) {
      try { window.localStorage.setItem(DAILY_KEY, JSON.stringify(value)); } catch (e) { /* storage may be unavailable */ }
    }

    /** Balance at the current local-midnight boundary; snapshots a new one when the day rolls over. */
    function dailyBalance(current) {
      const boundary = lastMidnightBoundary(Date.now());
      const stored = readDaily();
      if (stored && stored.boundary === boundary) return stored.balance;
      writeDaily({ boundary, balance: current });
      return current;
    }

    /** Live topped-up balance from the platform account, refreshed every minute. */
    function BalanceChip(ctx) {
      const [state, setState] = React.useState({ status: 'loading', amount: null, spent: null, detail: '' });
      React.useEffect(() => {
        let alive = true;
        const pull = async () => {
          const fail = (detail) => {
            if (alive) setState({ status: 'unavailable', amount: null, spent: null, detail });
          };
          try {
            /* Dynamic client plugins cannot reach the account Remote; the bundle's host
               half serves the same number at /zzz-fairy/balance over this origin. */
            const res = await fetch('/zzz-fairy/balance', {
              credentials: 'same-origin',
              headers: { accept: 'application/json' },
              cache: 'no-store',
            });
            if (!alive) return;
            if (!res.ok) {
              fail('余额接口 HTTP ' + res.status);
              return;
            }
            const payload = await res.json();
            if (!alive) return;
            if (!payload || payload.ok !== true) {
              fail('接口错误: ' + (payload && payload.error ? String(payload.error).slice(0, 160) : '未知'));
              return;
            }
            const wallets = pickWallets(payload.balance);
            if (!wallets || wallets.length === 0) {
              let preview = '';
              try { preview = JSON.stringify(payload.balance).slice(0, 140); } catch (e) { preview = String(payload.balance).slice(0, 140); }
              fail('返回无钱包: ' + preview);
              return;
            }
            const wallet = wallets.find((w) => w && w.currency === 'CNY') || wallets[0];
            const amount = formatMoney(wallet && wallet.balance);
            const value = Number(wallet && wallet.balance);
            let spent = null;
            if (Number.isFinite(value)) {
              const base = dailyBalance(value);
              const diff = base - value;
              if (Number.isFinite(diff)) spent = (diff > 0 ? diff : 0).toFixed(2);
            }
            setState({ status: 'ready', amount, spent, detail: '' });
          } catch (e) {
            const msg = e && e.message ? String(e.message).slice(0, 160) : String(e).slice(0, 160);
            fail(msg);
            if (window.console && window.console.warn) window.console.warn('[fairy-skin] balance unavailable:', e);
          }
        };
        pull();
        const timer = window.setInterval(pull, 60000);
        return () => { alive = false; window.clearInterval(timer); };
      }, []);
      const failed = state.status === 'unavailable';
      const text = state.status === 'loading' ? '…' : (state.amount != null ? '¥' + state.amount : '—');
      const title = failed
        ? '账户余额暂不可用：' + (state.detail || '未知原因')
        : '剩余 = 账户余额；今日 = 今天 0 点余额 − 当前余额';
      return h('span', { className: 'zzz-cost-chip' + (failed ? ' is-failed' : ''), title },
        h('i', { className: 'zzz-cost-dot' }),
        '剩余电费 ',
        h('b', null, text),
        state.spent != null ? h('em', { className: 'zzz-cost-today' }, '今日电费 ¥' + state.spent) : null);
    }

    /* ---------------- voice replies (Fairy 语音) ---------------- */

    const VOICE_KEY = 'zzz-fairy-voice-v1';
    const VOICE_QUIET_MS = 2500;

    let voiceAudio = null;
    let voiceUrl = null;
    let voiceCtx = null;
    let voiceSource = null;
    let voiceAudible = false;
    let voiceStateCleanup = null;
    function setVoiceAudible(value) {
      if (voiceAudible === value) return;
      voiceAudible = value;
      voiceEmit();
    }
    function VoiceWave() {
      useVoicePlaying();
      const audible = voicePref().auto === true && voiceAudible;
      return h('span', {
        className: 'zzz-voice-wave' + (audible ? ' is-audible' : ''),
        role: 'img', 'aria-label': audible ? 'Fairy 正在说话' : 'Fairy 语音待机',
        title: audible ? 'Fairy 正在说话' : 'Fairy 语音待机',
      }, Array.from({ length: 12 }, (_, i) => h('i', {
        key: i, 'aria-hidden': true, style: { '--wave-delay': (-i * .137) + 's' },
      })));
    }
    let voicePlayingId = null;
    let voiceError = null;
    let voiceToken = 0;
    let voiceAbort = null;
    let autoSpeakTimer = null;
    let voiceQuietUntil = 0;
    let voiceErrorTimer = null;
    let voiceContextTimer = null;
    const voiceListeners = new Set();

    /** Create or resume the playback context; browsers only allow it in a gesture. */
    function unlockAudio() {
      window.clearTimeout(voiceContextTimer);
      voiceContextTimer = null;
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        if (!voiceCtx || voiceCtx.state === 'closed') voiceCtx = new Ctor();
        if (voiceCtx.state === 'suspended') voiceCtx.resume().catch(() => {});
      } catch (error) { /* no Web Audio: the <audio> path still runs */ }
    }

    function voiceEmit() {
      for (const fn of voiceListeners) { try { fn(); } catch (e) { /* listener must not break playback */ } }
    }

    /** Subscribe a component to the single global "who is speaking" slot. */
    function useVoicePlaying() {
      const [, force] = React.useState(0);
      React.useEffect(() => {
        const fn = () => force((n) => n + 1);
        voiceListeners.add(fn);
        return () => { voiceListeners.delete(fn); };
      }, []);
      return voicePlayingId;
    }

    function voicePref() {
      try { return JSON.parse(window.localStorage.getItem(VOICE_KEY) || '{}') || {}; } catch (e) { return {}; }
    }

    function setVoicePref(patch) {
      const next = Object.assign(voicePref(), patch);
      try { window.localStorage.setItem(VOICE_KEY, JSON.stringify(next)); } catch (e) { /* storage may be unavailable */ }
      voiceEmit();
      return next;
    }

    /**
     * Silence everything and invalidate any synthesis still in flight.
     * `voiceToken` is the generation guard: a fetch that resolves after a newer
     * request started must discard its audio instead of starting a second voice.
     */
    function stopVoice() {
      voiceToken += 1;
      if (voiceStateCleanup) { voiceStateCleanup(); voiceStateCleanup = null; }
      setVoiceAudible(false);
      if (voiceAbort) { try { voiceAbort.abort(); } catch (e) { /* ignore */ } voiceAbort = null; }
      if (voiceSource) {
        try { voiceSource.onended = null; voiceSource.stop(); } catch (e) { /* already stopped */ }
        try { voiceSource.disconnect(); voiceSource.buffer = null; } catch (e) { /* detached */ }
        voiceSource = null;
      }
      if (voiceAudio) {
        voiceAudio.onplaying = voiceAudio.onpause = voiceAudio.onwaiting = voiceAudio.onended = voiceAudio.onerror = null;
        try { voiceAudio.pause(); voiceAudio.removeAttribute('src'); voiceAudio.load(); } catch (e) { /* detached */ }
        voiceAudio = null;
      }
      if (voiceUrl) { try { URL.revokeObjectURL(voiceUrl); } catch (e) { /* ignore */ } voiceUrl = null; }
      if (voicePlayingId !== null) { voicePlayingId = null; voiceEmit(); }
      window.clearTimeout(voiceContextTimer);
      // Suspend keeps automatic playback permission; close on plugin/page disposal.
      voiceContextTimer = window.setTimeout(() => {
        voiceContextTimer = null;
        if (voicePlayingId === null && voiceCtx && voiceCtx.state === 'running') voiceCtx.suspend().catch(() => {});
      }, 30000);
    }

    function disposeVoice() {
      window.clearTimeout(autoSpeakTimer);
      autoSpeakTimer = null;
      stopVoice();
      window.clearTimeout(voiceErrorTimer);
      window.clearTimeout(voiceContextTimer);
      voiceErrorTimer = voiceContextTimer = null;
      voiceError = null;
      const context = voiceCtx;
      voiceCtx = null;
      if (context && context.state !== 'closed') context.close().catch(() => {});
      voiceListeners.clear();
    }

    /** Synthesize on the Host and play it here; exactly one voice at a time. */
    async function speakMessage(id, text) {
      if (autoSpeakTimer !== null) { window.clearTimeout(autoSpeakTimer); autoSpeakTimer = null; }
      const clean = String(text || '').trim();
      if (!clean) { voiceFail(id, '没找到这条回复的文本'); return; }
      if (voicePlayingId === id) { stopVoice(); return; }
      unlockAudio();               // must happen inside the click, before any await
      stopVoice();
      window.clearTimeout(voiceContextTimer);
      voiceContextTimer = null;
      const token = voiceToken;    // capture after stopVoice bumped it
      const abort = new AbortController();
      voiceAbort = abort;
      voicePlayingId = id;
      voiceEmit();
      try {
        const res = await fetch('/zzz-fairy/tts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: clean }),
          signal: abort.signal,
        });
        if (token !== voiceToken) return;           // superseded while waiting
        if (!res.ok) {
          const detail = await res.json().catch(() => null);
          throw new Error((detail && detail.error) || ('tts HTTP ' + res.status));
        }
        const bytes = await res.arrayBuffer();
        if (token !== voiceToken) return;
        /* Web Audio keeps playing after the click's activation window (CPU TTS
           takes seconds). Falls back to <audio> when the context is absent. */
        if (voiceCtx) {
          const buffer = await voiceCtx.decodeAudioData(bytes);
          if (token !== voiceToken) return;
          const source = voiceCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(voiceCtx.destination);
          source.onended = () => { if (token === voiceToken) stopVoice(); };
          voiceSource = source;
          voiceAbort = null;
          source.start();
          const updateAudible = () => {
            if (token === voiceToken) setVoiceAudible(voiceCtx.state === 'running' && voiceSource === source);
          };
          voiceCtx.addEventListener('statechange', updateAudible);
          voiceStateCleanup = () => {
            voiceCtx.removeEventListener('statechange', updateAudible);
            source.disconnect();
          };
          updateAudible();
          return;
        }
        voiceUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
        voiceAudio = new Audio(voiceUrl);
        const updateMedia = value => { if (token === voiceToken) setVoiceAudible(value); };
        voiceAudio.onplaying = () => updateMedia(true);
        voiceAudio.onpause = voiceAudio.onwaiting = () => updateMedia(false);
        voiceAudio.onended = () => { if (token === voiceToken) stopVoice(); };
        voiceAudio.onerror = () => { if (token === voiceToken) stopVoice(); };
        voiceAbort = null;
        await voiceAudio.play();
      } catch (error) {
        if (token !== voiceToken) return;           // cancelled on purpose: stay quiet
        stopVoice();
        const message = String((error && error.message) || error).slice(0, 120);
        voiceFail(id, message);
        if (window.console && window.console.warn) window.console.warn('[fairy-voice]', error);
      }
    }

    /**
     * Auto-read only the reply that actually ends the turn: a turn can finalize
     * several assistant steps in a row, and speaking each of them stacks voices.
     * Debounce on quiet, then speak the newest text once.
     */
    function scheduleAutoSpeak(id, text) {
      if (autoSpeakTimer !== null) window.clearTimeout(autoSpeakTimer);
      autoSpeakTimer = window.setTimeout(() => {
        autoSpeakTimer = null;
        if (voicePref().auto === true) speakMessage(id, text);
      }, 1200);
    }

    function cancelAutoSpeak() {
      if (autoSpeakTimer !== null) window.clearTimeout(autoSpeakTimer);
      autoSpeakTimer = null;
    }

    /** Surface a failed read on the button itself (it is otherwise silent). */
    function voiceFail(id, message) {
      voiceError = { id, message };
      voiceEmit();
      window.clearTimeout(voiceErrorTimer);
      voiceErrorTimer = window.setTimeout(() => {
        voiceErrorTimer = null;
        if (voiceError && voiceError.id === id) { voiceError = null; voiceEmit(); }
      }, 6000);
    }

    /**
     * The chat store exposes nodes through `values()`, `legacy.nodes` and (in
     * newer builds) a `nodes` Map — never as plain enumerable object fields — so
     * a generic object walk finds nothing. Collect every candidate list and
     * match the closing node exactly the way the shell does:
     * `data.closing.finalNode.messageId`.
     */
    function collectBlocks(snapshot, messageId) {
      if (!snapshot) return null;
      const nodes = [];
      const seen = new Set();
      const addList = (list) => {
        if (!list) return;
        const each = typeof list === 'object' && typeof list.values === 'function' && !Array.isArray(list)
          ? () => list.values()
          : () => list;
        try {
          for (const node of each()) {
            if (node && typeof node === 'object' && !seen.has(node)) { seen.add(node); nodes.push(node); }
          }
        } catch (error) { /* ignore a list that refuses iteration */ }
      };

      try {
        addList(snapshot.nodes);
        if (typeof snapshot.values === 'function') addList(snapshot.values());
        addList(snapshot.legacy && snapshot.legacy.nodes);
        addList(snapshot.timeline && snapshot.timeline.nodes);
        addList(snapshot.list);
      } catch (error) { /* unexpected snapshot shape: fall through */ }

      let fallback = null;
      for (const node of nodes) {
        const data = node && node.data;
        if (!data) continue;
        const closing = data.closing;
        if (closing && closing.finalNode && closing.finalNode.messageId === messageId && Array.isArray(closing.blocks)) {
          return closing.blocks;
        }
        if (node.kind === 'assistant-step' && Array.isArray(data.blocks)) {
          if (!fallback || (node.seq || 0) >= (fallback.seq || 0)) fallback = node;
        }
      }
      return null; // Never read a different message when the requested one is absent.
    }

    /** Plain text of one finalized assistant message ('' when it cannot be found). */
    function assistantTextFrom(snapshot, messageId) {
      if (!snapshot || !messageId) return '';
      const blocks = collectBlocks(snapshot, messageId);
      if (!blocks) return '';
      return blocks
        .filter((block) => block && block.kind === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n')
        .trim();
    }

    function SpeakerIcon({ muted }) {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, className: 'zzz-voice-icon' },
        h('path', { d: 'M3 6.1h2.2L8.4 3.5v9L5.2 9.9H3z', fill: 'currentColor' }),
        muted
          ? h('path', { d: 'M10.7 6.2l2.6 3.6M13.3 6.2l-2.6 3.6', stroke: 'currentColor', strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' })
          : h('path', { d: 'M10.5 5.7a3.2 3.2 0 0 1 0 4.6M12.4 4.3a5.6 5.6 0 0 1 0 7.4', stroke: 'currentColor', strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' }));
    }

    /** Composer-toolbar switch: read every new reply aloud. */
    function VoiceToggle() {
      const playing = useVoicePlaying();
      const on = voicePref().auto === true;
      return h('button', {
        type: 'button',
        className: 'zzz-voice-toggle' + (on ? ' is-on' : ''),
        title: on ? 'Fairy 语音：开启（回复完成后自动朗读）' : 'Fairy 语音：关闭',
        'aria-pressed': on ? 'true' : 'false',
        onClick: () => {
          if (!on) unlockAudio();
          cancelAutoSpeak();
          if (on || playing !== null) stopVoice();
          setVoicePref({ auto: !on });
        },
      }, h(SpeakerIcon, { muted: !on }));
    }

    /** One action beside copy/retry: read this reply (and auto-read it once). */
    function ManualVoiceReader({ useChat, messageId, onRead }) {
      const select = React.useCallback(snapshot => assistantTextFrom(snapshot, messageId), [messageId]);
      const text = useChat(select);
      React.useEffect(() => {
        onRead();
        speakMessage(messageId, text || '');
      }, [messageId, text, onRead]);
      return null;
    }

    function SpeakAction(props) {
      const { messageId, useChat } = props;
      const [requested, setRequested] = React.useState(false);
      const onRead = React.useCallback(() => setRequested(false), []);
      const playing = useVoicePlaying();
      const isPlaying = playing === messageId;
      const failed = voiceError !== null && voiceError.id === messageId;
      return h(React.Fragment, null,
        requested && typeof useChat === 'function'
          ? h(ManualVoiceReader, { useChat, messageId, onRead }) : null,
        h('button', {
          type: 'button',
          className: 'zzz-voice-action' + (isPlaying ? ' is-playing' : '') + (failed ? ' is-error' : ''),
          title: failed ? '朗读失败：' + voiceError.message : (isPlaying ? '停止朗读' : '朗读这条回复'),
          'aria-label': isPlaying ? '停止朗读' : '朗读这条回复',
          onClick: event => {
            event.stopPropagation();
            unlockAudio();
            if (isPlaying) stopVoice();
            else if (typeof useChat === 'function') setRequested(true);
            else voiceFail(messageId, '当前页面没有提供消息读取接口');
          },
        }, h(SpeakerIcon, { muted: false })));
    }

    /** Mounted once per session: suppress auto-read for the backlog on open. */
    function VoiceSession(props) {
      useVoicePlaying();
      React.useEffect(() => () => {
        cancelAutoSpeak();
        stopVoice();
      }, []);
      return voicePref().auto === true && typeof props.useChat === 'function'
        ? h(AutoVoiceMonitor, { useChat: props.useChat }) : null;
    }

    function latestClosing(snapshot) {
      let latest = null;
      const lists = [snapshot && snapshot.nodes, snapshot && snapshot.legacy && snapshot.legacy.nodes];
      for (const list of lists) {
        if (!list) continue;
        const values = typeof list.values === 'function' ? list.values() : list;
        if (!values || typeof values[Symbol.iterator] !== 'function') continue;
        for (const node of values) {
          const closing = node && node.data && node.data.closing;
          if (closing && closing.finalNode && closing.finalNode.messageId &&
              (!latest || (node.seq || 0) > (latest.seq || 0))) latest = node;
        }
      }
      if (!latest) return '';
      const closing = latest.data.closing;
      const text = (closing.blocks || []).filter(b => b.kind === 'text' && typeof b.text === 'string')
        .map(b => b.text).join('\n').trim();
      let time = typeof closing.time === 'number' ? closing.time : Date.parse(closing.time);
      // DSH event timestamps may be Unix seconds or JavaScript milliseconds,
      // depending on the event source. Compare them in one unit so a fresh
      // reply is not mistaken for old history.
      if (Number.isFinite(time) && time > 0 && time < 1e12) time *= 1000;
      return JSON.stringify([closing.finalNode.messageId, text, Number.isFinite(time) ? time : 0]);
    }

    // Exactly one chat subscription while auto-read is enabled. Only strings
    // survive selection; no component retains a whole chat snapshot.
    function AutoVoiceMonitor({ useChat }) {
      const closing = useChat(latestClosing);
      const initial = React.useRef(true);
      const enabledAt = React.useRef(Date.now());
      const seen = React.useRef(new Set());
      React.useEffect(() => {
        if (initial.current) {
          initial.current = false;
          if (closing) seen.current.add(JSON.parse(closing)[0]);
          return;
        }
        if (!closing) return;
        const [id, text, completedAt] = JSON.parse(closing);
        if (seen.current.has(id) || !text) return;
        seen.current.add(id);
        if (seen.current.size > 128) seen.current.delete(seen.current.values().next().value);
        // Event time can be second-precision, while enabledAt is millisecond-
        // precision. Allow one timestamp bucket plus delivery latency.
        if (completedAt && completedAt + 5000 < enabledAt.current) return;
        scheduleAutoSpeak(id, text);
      }, [closing]);
      React.useEffect(() => () => cancelAutoSpeak(), []);
      return null;
    }

    /** Full-frame HDD-style boot greeting, mirroring the reference video. */
    function BootOverlay({ t, onDone }) {
      const [visible, setVisible] = React.useState(0);
      const [leaving, setLeaving] = React.useState(false);
      const [done, setDone] = React.useState(false);
      const timers = React.useRef([]);
      const doneRef = React.useRef(onDone);
      doneRef.current = onDone;

      const dismiss = React.useCallback(() => {
        timers.current.forEach((id) => window.clearTimeout(id));
        timers.current = [];
        setVisible(BOOT_LINES.length);
        setLeaving(true);
        timers.current.push(window.setTimeout(() => setDone(true), 450));
      }, []);

      React.useEffect(() => {
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const at = (ms, fn) => { timers.current.push(window.setTimeout(fn, ms)); };
        if (reduced) {
          at(150, () => setVisible(BOOT_LINES.length));
          at(1500, () => setLeaving(true));
          at(1950, () => setDone(true));
        } else {
          BOOT_LINES.forEach((_, i) => at(450 + i * 520, () => setVisible(i + 1)));
          at(3200, () => setLeaving(true));
          at(3650, () => setDone(true));
        }
        const onKey = () => dismiss();
        window.addEventListener('keydown', onKey, { once: true });
        return () => {
          window.removeEventListener('keydown', onKey);
          timers.current.forEach((id) => window.clearTimeout(id));
        };
      }, [dismiss]);

      React.useEffect(() => {
        if (done && typeof doneRef.current === 'function') doneRef.current();
      }, [done]);

      if (done) return null;
      const hour = new Date().getHours();
      const greetKey = hour < 11 ? 'lineGreetMorning' : hour < 17 ? 'lineGreetNoon' : 'lineGreetEvening';
      const texts = [t('lineBoot'), t('lineInit'), t('lineNormal'), t(greetKey), t('lineStandby')];
      const pct = Math.min(100, Math.round((visible / BOOT_LINES.length) * 100));
      return h('div', { className: 'zzz-boot' + (leaving ? ' leaving' : ''), onClick: dismiss, 'aria-hidden': true },
        h('svg', { className: 'zzz-boot-web', viewBox: '0 0 400 400', preserveAspectRatio: 'xMidYMid slice' },
          h('path', { d: WEB_PATH, stroke: '#5b8cff', strokeWidth: 1, fill: 'none', opacity: 0.22 })),
        h('div', { className: 'zzz-boot-core' },
          h(Orb, { size: 220, pulse: true }),
          h('div', { className: 'zzz-boot-title' }, 'FAIRY'),
          h('div', { className: 'zzz-boot-sub' }, t('bootSub')),
          h('div', { className: 'zzz-boot-lines' },
            texts.map((text, i) => h('div', { key: i, className: 'zzz-boot-line' + (i < visible ? ' on' : '') },
              h('span', { className: 'zzz-boot-caret' }, '>'), text))),
          h('div', { className: 'zzz-boot-track' }, h('div', { className: 'zzz-boot-bar', style: { width: pct + '%' } }))),
        h('div', { className: 'zzz-boot-skip' }, t('skip')));
    }

    /**
     * The opening, in three beats:
     *   1. the bundled HDD video plays once (skippable),
     *   2. the still frame and Fairy fade in together over the video's last
     *      second, so there is no black gap and the app never peeks through,
     *   3. the frame fades as Fairy moves into the bottom-left seat.
     */
    const HERO_LEAD_MS = 900;
    const VIDEO_FADE_MS = 1200;

    function BootSequence({ t }) {
      const [stage, setStage] = React.useState('video');
      const [videoBroken, setVideoBroken] = React.useState(false);
      const [videoGone, setVideoGone] = React.useState(false);
      const videoRef = React.useRef(null);
      const enteredRef = React.useRef(false);
      const fadeTimer = React.useRef(null);
      React.useEffect(() => {
        const image = new Image();
        image.src = '/zzz-fairy/boot-bg.png?v=1';
        return () => {
          image.removeAttribute('src');
          window.clearTimeout(fadeTimer.current);
        };
      }, []);

      const attachVideo = React.useCallback(video => {
        const old = videoRef.current;
        if (old && old !== video) {
          old.pause();
          old.removeAttribute('src');
          old.load();
        }
        videoRef.current = video;
      }, []);

      const finish = React.useCallback(() => setStage('done'), []);
      const toHero = React.useCallback(() => {
        if (enteredRef.current) return;
        enteredRef.current = true;
        setStage('hero');
        fadeTimer.current = window.setTimeout(() => setVideoGone(true), VIDEO_FADE_MS);
      }, []);

      React.useEffect(() => {
        if (stage !== 'video') return undefined;
        /* Safety net: never trap the app behind a video that cannot play. */
        const guard = window.setTimeout(toHero, 20000);
        return () => window.clearTimeout(guard);
      }, [stage, toHero]);

      /* React does not reliably reflect `muted` to the DOM, and an unmuted
         autoplay is blocked — set the property and start playback by hand. */
      React.useEffect(() => {
        if (stage !== 'video' || videoBroken) return undefined;
        const video = videoRef.current;
        if (!video) return undefined;
        video.muted = true;
        video.defaultMuted = true;
        const played = video.play();
        if (played && typeof played.catch === 'function') {
          played.catch(() => { /* blocked autoplay: the guard timer moves on */ });
        }
        return undefined;
      }, [stage, videoBroken]);

      /* Start the hand-over before the video ends: the hero fades in on top of
         the still-moving picture instead of after a black gap. */
      const onTimeUpdate = React.useCallback(() => {
        const video = videoRef.current;
        if (!video || enteredRef.current) return;
        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        if (duration - video.currentTime <= HERO_LEAD_MS / 1000) toHero();
      }, [toHero]);

      if (stage === 'done') return null;

      const videoLayer = !videoGone && !videoBroken
        ? h('div', { className: 'zzz-boot-video-wrap' + (stage === 'hero' ? ' is-leaving' : ''), onClick: toHero },
          h('video', {
            ref: attachVideo,
            className: 'zzz-boot-video',
            src: '/zzz-fairy/boot.mp4',
            autoPlay: true,
            muted: true,
            playsInline: true,
            preload: 'auto',
            onTimeUpdate,
            onEnded: toHero,
            onError: () => { setVideoBroken(true); toHero(); },
          }),
          h('div', { className: 'zzz-boot-video-skip' }, t('skip')))
        : null;

      return h('div', { className: 'zzz-boot-overlay' },
        videoLayer,
        stage === 'hero' || videoBroken ? h(BootHero, { onDone: finish }) : null);
    }

    /** Frame + Fairy fade in; then the frame fades as Fairy docks. */
    function BootHero({ onDone }) {
      const [bgOut, setBgOut] = React.useState(false);
      const [docked, setDocked] = React.useState(false);
      const [leaving, setLeaving] = React.useState(false);
      const [target, setTarget] = React.useState(null);
      const orbRef = React.useRef(null);
      const doneRef = React.useRef(onDone);
      doneRef.current = onDone;
      const greeting = '主人，我回来了。Fairy 已就绪，随时听候你的吩咐。';
      React.useEffect(() => {
        /* Boot greeting is independent of auto-reading chat replies. Do not
           synchronously test AudioContext.state after requesting resume():
           resume is asynchronous and that test permanently skipped greeting.
           speakMessage resumes audio before awaiting synthesis. */
        if (voicePlayingId === null) {
          speakMessage('fairy-boot-greeting', greeting);
        }
      }, []);

      /* Measure the real sidebar orb instead of trusting a CSS variable: the
         landing has to be pixel-identical or the hand-off reads as a jump. */
      React.useLayoutEffect(() => {
        const seat = document.querySelector('.zzz-orb-corner-inner');
        const orb = orbRef.current;
        if (!seat || !orb) return;
        const from = orb.getBoundingClientRect();
        const to = seat.getBoundingClientRect();
        if (!from.width || !to.width) return;
        const seatAnimations = seat.getAnimations({ subtree: true });
        for (const animation of orb.getAnimations({ subtree: true })) {
          const source = seatAnimations.find(item => item.animationName === animation.animationName);
          if (source) animation.currentTime = source.currentTime;
        }
        setTarget({
          dx: (to.left + to.width / 2) - (from.left + from.width / 2),
          dy: (to.top + to.height / 2) - (from.top + from.height / 2),
          scale: to.width / from.width,
        });
      }, []);

      React.useEffect(() => {
        /* Fade in and hold; fade the background and dock together for 1.2s,
           then crossfade the aligned orb into its real seat. */
        const bgTimer = window.setTimeout(() => setBgOut(true), 1900);
        const dockTimer = window.setTimeout(() => setDocked(true), 1900);
        const leaveTimer = window.setTimeout(() => setLeaving(true), 3120);
        const goneTimer = window.setTimeout(() => {
          if (typeof doneRef.current === 'function') doneRef.current();
        }, 3120 + 240);
        return () => {
          window.clearTimeout(bgTimer);
          window.clearTimeout(dockTimer);
          window.clearTimeout(leaveTimer);
          window.clearTimeout(goneTimer);
        };
      }, []);

      const style = target
        ? {
          transform: docked
            ? `translate(-50%, -50%) translate(${target.dx}px, ${target.dy}px) scale(${target.scale})`
            : 'translate(-50%, -50%) translate(0px, 0px) scale(1)',
        }
        : undefined;

      const classes = 'zzz-boot-hero'
        + (bgOut ? ' is-bgout' : '')
        + (docked ? ' is-docked' : '')
        + (leaving ? ' is-leaving' : '');

      return h('div', {
        className: classes,
        'aria-hidden': true,
        onClick: () => { if (typeof doneRef.current === 'function') doneRef.current(); },
      },
        h('div', { className: 'zzz-boot-hero-bg' }),
        h('button', {
          className: 'zzz-boot-greeting', type: 'button', title: '点击朗读问候',
          onClick: event => { event.stopPropagation(); speakMessage('fairy-boot-greeting', greeting); },
        }, greeting),
        h('div', { className: 'zzz-boot-hero-orb', ref: orbRef, style },
          h(Orb, { size: 260 })));
    }

    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind(LOCALE_NS);
        ctx.effect(
          () => ctx.locale.register(LOCALE_NS, {
            zh: {
              bootSub: '新艾利都 · HDD 智能管家系统',
              lineBoot: 'HDD 系统已启动',
              lineInit: '系统启动完成',
              lineNormal: '初始化已经完成，一切正常',
              lineGreetMorning: '主人，早上好呀',
              lineGreetNoon: '主人，下午好呀',
              lineGreetEvening: '主人，晚上好呀',
              lineStandby: 'Fairy 在此待命，今天也有我陪着主人。',
              skip: '点按任意处跳过',
            },
            en: {
              bootSub: 'NEW ERIDU · HDD SMART BUTLER SYSTEM',
              lineBoot: 'HDD system online',
              lineInit: 'System boot complete',
              lineNormal: 'Initialization finished. All systems normal.',
              lineGreetMorning: 'Good morning, Master.',
              lineGreetNoon: 'Good afternoon, Master.',
              lineGreetEvening: 'Good evening, Master.',
              lineStandby: 'Fairy is on standby. I am by your side today, Master.',
              skip: 'Click anywhere to skip',
            },
          }),
          LAYER_SOURCE + ': locale',
        );
        ctx.effect(
          () => ctx.theme.overrideTokens(LAYER_SOURCE, TOKENS),
          LAYER_SOURCE + ': tokens',
        );
        ctx.effect(() => {
          const style = document.createElement('style');
          style.textContent = SKIN_CSS;
          document.head.appendChild(style);
          const scan = document.createElement('div');
          scan.className = 'zzz-scanlines';
          scan.setAttribute('aria-hidden', 'true');
          document.body.appendChild(scan);
          return () => { style.remove(); scan.remove(); };
        }, LAYER_SOURCE + ': styles');
        ctx.effect(
          installOpt01SidebarBreakpoint,
          LAYER_SOURCE + ': opt-01-sidebar-breakpoint',
        );
        ctx.effect(installMovingScan, LAYER_SOURCE + ': memory-01-scan');

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'zzz-fairy-boot', order: 100,
        }, () => h(BootSequence, { t })));
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'zzz-fairy-orb', order: 50,
        }, FloatingOrb));
        /* Single slots carry an occupant already (the official brand). Shadow it
           with a lower priority: equal priority is a conflict in this build. */
        ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({
          name: 'sidebar.brand.mark', priority: -1,
        }, (props) => h(Orb, { size: props && props.size ? props.size : 26, staticMark: true })));
        ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({
          name: 'sidebar.brand.name', priority: -1,
        }, BrandName));
        /* The hero title row asks for 34px; 26px keeps the mark subordinate to
           the 22px headline like the reference. Artwork itself is unchanged. */
        ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({
          name: 'conversation.hero.brand.mark', priority: -1,
        }, (props) => h(Orb, { size: 26, pulse: true, staticMark: true })));
        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left', id: 'zzz-fairy-balance', order: 20,
        }, () => h(BalanceChip, { ctx })));
        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left', id: 'zzz-fairy-voice-wave', order: 25,
        }, VoiceWave));
        ctx.effect(() => {
          window.addEventListener('pagehide', disposeVoice);
          return () => { window.removeEventListener('pagehide', disposeVoice); disposeVoice(); };
        }, LAYER_SOURCE + ': voice-wave-cleanup');

        /* Voice replies: a switch in the composer toolbar, one speaker action per
           finalized reply, and a session-scoped guard for the backlog. The switch
           lives in `input.left` because `input.right` is hidden while a reply is
           streaming, which is exactly when the switch must stay reachable. */
        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left', id: 'zzz-fairy-voice', order: 30,
          label: () => 'Fairy 语音',
        }, VoiceToggle));
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock', id: 'zzz-fairy-voice-session', order: 5,
        }, VoiceSession));
        ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
          name: 'conversation.chat.assistant-actions', id: 'zzz-fairy-speak', order: 5,
        }, SpeakAction));
      },
    };
  },
});
