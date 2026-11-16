import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Frosted looks, dark and light. Switch with /quiet-glass <name> (renameable in the
// plugin's config); the pick is remembered.

// Lighten a #rrggbb toward white by `t` (0..1). Tune LIFT to make every dark variant lighter/darker.
const LIFT = 0.06
function lift(hex: string, t = LIFT): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (s: number) => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * t).toString(16).padStart(2, '0')
  return `#${ch(16)}${ch(8)}${ch(0)}`
}

type Variant = {
  light?: true
  surfaces: [string, string, string, string] // surface-0..3 (light: 2 and 3 must match)
  text: [string, string, string] // primary, secondary, muted
  accent: string
  pro: string
  glows: [string, string]
}

const VARIANTS: Record<string, Variant> = {
  // ---- dark ----
  dusk: { // graphite + plum (the original)
    surfaces: ['#131217', '#18171d', '#1d1c23', '#222129'],
    text: ['#e6e3ec', '#bdb8c8', '#9a95a6'],
    accent: '#8b7bb8', pro: '#a07aa8',
    glows: ['#3a2f55', '#2a3a38'],
  },
  moss: { // forest floor at night
    surfaces: ['#111512', '#161b17', '#1b211c', '#202721'],
    text: ['#e2e9e3', '#b9c4bb', '#95a297'],
    accent: '#7fa08a', pro: '#9a88a8',
    glows: ['#22402e', '#2f3826'],
  },
  wine: { // deep burgundy, muted rose
    surfaces: ['#161214', '#1c1719', '#221c1f', '#272124'],
    text: ['#ece3e6', '#c8b9be', '#a6959b'],
    accent: '#b07a8e', pro: '#9a7ab0',
    glows: ['#4a2232', '#33243a'],
  },
  ink: { // neutral charcoal, deep indigo
    surfaces: ['#121318', '#17181e', '#1c1d24', '#21222a'],
    text: ['#e3e4ec', '#babcc8', '#9698a6'],
    accent: '#7b80b8', pro: '#a07aa8',
    glows: ['#252a50', '#2a2a36'],
  },
  ember: { // warm charcoal, dying embers
    surfaces: ['#161311', '#1c1816', '#221d1a', '#28221e'],
    text: ['#ece5e0', '#c8bcb3', '#a69890'],
    accent: '#b5806a', pro: '#a07aa8',
    glows: ['#4a2a1e', '#35241f'],
  },
  // ---- light (tinted, never white) ----
  lilac: { // lavender mist
    light: true,
    surfaces: ['#dcd8e4', '#e2dee9', '#e8e5ee', '#e8e5ee'],
    text: ['#24212b', '#4a4555', '#5c566a'],
    accent: '#6b5a9a', pro: '#8a5a8f',
    glows: ['#b9a6dc', '#a9c6b8'],
  },
  sage: { // pale green-grey
    light: true,
    surfaces: ['#d6dfd7', '#dce4dd', '#e3e9e3', '#e3e9e3'],
    text: ['#1f2a22', '#435046', '#535f56'],
    accent: '#4f7a5e', pro: '#7a5f8a',
    glows: ['#a6caae', '#b8b0cc'],
  },
  clay: { // dusty rose
    light: true,
    surfaces: ['#e2d6d7', '#e7dcdd', '#ece3e3', '#ece3e3'],
    text: ['#2b2022', '#54464a', '#66575b'],
    accent: '#9a5a6a', pro: '#7a5a9a',
    glows: ['#d8a6b2', '#c2a8cc'],
  },
  stone: { // warm grey pebble
    light: true,
    surfaces: ['#dad7d3', '#e0ddd9', '#e6e3e0', '#e6e3e0'],
    text: ['#26231f', '#4d4843', '#5e5852'],
    accent: '#6e6288', pro: '#8a5a7a',
    glows: ['#c6b6ae', '#aebcb4'],
  },
}
const NAMES = Object.keys(VARIANTS)

function look(name: string): { look: ThemeSetArgs; blocking?: string } {
  const v = VARIANTS[name]!
  const [s0, s1, s2, s3] = v.light ? v.surfaces : v.surfaces.map(s => lift(s))
  const [tp, ts, tm] = v.text
  const anchors = {
    'surface-0': s0!, 'surface-1': s1!, 'surface-2': s2!, 'surface-3': s3!,
    'text-primary': tp, 'text-secondary': ts, 'text-muted': tm,
  }
  const mode = v.light ? 'light' : 'dark'
  const { theme, problems } = makeColors({
    label: `Glass ${name}`,
    only: mode,
    roles: { accent: v.accent, danger: '#b8616a', success: '#6e9a7a', warning: '#b07a5a', pro: v.pro },
    [mode]: { gray: { anchors } },
  })
  return {
    look: {
      colors: theme,
      backdrop: { scene: name, glass: { blur: 44, tint: s0!, opacity: v.light ? 0.45 : 0.4 } },
    },
    blocking: problems.find(l => l.startsWith("Desktop won't paint")),
  }
}

// Two soft blobs drifting over ~90s: barely noticeable, nothing flashy.
function scene(name: string): string {
  const v = VARIANTS[name] ?? VARIANTS.dusk!
  const ground = v.light ? v.surfaces[0] : lift(v.surfaces[0])
  const glow = (c: string) => (v.light ? c : lift(c, 0.12))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter></defs>
<style>
.a{animation:d1 90s ease-in-out infinite alternate}
.c{animation:d2 110s ease-in-out infinite alternate}
@keyframes d1{to{transform:translate(180px,120px)}}
@keyframes d2{to{transform:translate(-200px,-90px)}}
@media (prefers-reduced-motion:reduce){.a,.c{animation:none}}
</style>
<rect width="1600" height="1000" fill="${ground}"/>
<g filter="url(#b)">
<circle class="a" cx="300" cy="250" r="420" fill="${glow(v.glows[0])}" opacity=".75"/>
<circle class="c" cx="1300" cy="780" r="460" fill="${glow(v.glows[1])}" opacity=".65"/>
</g>
</svg>`
}

async function apply($: EngineInterface, name: string) {
  const { look: l, blocking } = look(name)
  if (blocking !== undefined) $.ui.toast(blocking)
  const set = await $.theme.set(l)
  if (!set.isDrawn) $.ui.status(set.reason)
}

export const register: Register = (on, options) => {
  const cmd = typeof options.command === 'string' && options.command.trim() ? options.command.trim().replace(/^\//, '') : 'quiet-glass'

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: cmd, description: 'Switch glass theme color', argumentHint: NAMES.join(' | ') })
    const saved = await $.store.get('variant')
    await apply($, typeof saved === 'string' && saved in VARIANTS ? saved : 'dusk')
    return next(e)
  })

  on('command.run', { command: cmd }, async ($, e) => {
    const name = e.args.trim().toLowerCase()
    if (!(name in VARIANTS)) return { text: `Pick one: ${NAMES.join(', ')}` }
    await $.store.set('variant', name)
    await apply($, name)
    return { text: `Theme: ${name}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={scene(String(e.props.scene))} alt="A soft glow drifting slowly" />
  })
}
