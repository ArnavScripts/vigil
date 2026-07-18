import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'
import Globe from './components/Globe'

// ─── Data ───────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  { type: 'CRIT', msg: 'Credential stuffing campaign — 2,847 banking portals targeted', loc: 'RU → US' },
  { type: 'WARN', msg: 'New phishing kit distributing fake e-banking pages', loc: 'Global' },
  { type: 'INFO', msg: 'SIM-swap fraud cluster dismantled — 14 suspects arrested', loc: 'Lagos' },
  { type: 'CRIT', msg: 'Deepfake voice bypass attempt on high-net-worth account', loc: 'HK → CH' },
  { type: 'WARN', msg: 'ATM jackpotting malware variant detected in wild', loc: 'EU' },
  { type: 'INFO', msg: 'AI detection engine flagged 3.2M anomalous transactions', loc: 'Global' },
  { type: 'CRIT', msg: 'Account takeover wave — biometric fallback exploited', loc: 'IN' },
  { type: 'WARN', msg: 'Business email compromise targeting CFOs', loc: 'US → APAC' },
]

const STATS = [
  { label: 'Threats neutralised', value: 847293, suffix: '', delta: '+12%', up: false },
  { label: 'Avg. response time', value: 0.4, suffix: 's', delta: '-18%', up: true },
  { label: 'Active investigations', value: 214, suffix: '', delta: '+7', up: false },
  { label: 'Users shielded', value: 48200000, suffix: '', delta: '+5%', up: true },
]

const FRAUD_TYPES = [
  {
    id: 'phishing',
    icon: '01',
    title: 'Phishing',
    severity: 'CRITICAL',
    sev: 'red',
    summary: 'Social engineering via email, SMS, or cloned websites to harvest credentials.',
    how: 'Attackers register domains that appear identical to legitimate bank URLs, send bulk messages with urgent calls-to-action, and harvest submitted credentials in real time.',
    indicators: [
      'Sender domain mismatches the institution (e.g. bank-secure.co vs bank.com)',
      'Urgency language: "Your account will be suspended in 24h"',
      'Links resolve to IP addresses or unrelated domains',
    ],
  },
  {
    id: 'sim-swap',
    icon: '02',
    title: 'SIM Swap',
    severity: 'HIGH',
    sev: 'amber',
    summary: 'Criminals socially engineer mobile carriers to port your number to attacker-controlled SIM.',
    how: 'Using leaked personal data, fraudsters impersonate the victim to a carrier agent. Once the number is ported, all SMS-based OTPs route to the attacker, enabling full account takeover.',
    indicators: [
      'Sudden loss of cellular signal with no network issues',
      'Carrier sends an unsolicited SIM-change confirmation',
      'Unable to receive calls or SMS',
    ],
  },
  {
    id: 'deepfake',
    icon: '03',
    title: 'Deepfake Audio',
    severity: 'HIGH',
    sev: 'amber',
    summary: 'AI-synthesised voice clones of executives or family members authorise fraudulent transfers.',
    how: 'From as little as three seconds of audio, modern text-to-speech models can clone a voice with 97% similarity. Attackers place live calls to finance teams requesting urgent wire transfers.',
    indicators: [
      'Unsolicited call from a "known" contact requesting wire transfers',
      'Background noise artifacts or slightly unnatural pauses',
      'Request bypasses standard approval workflows',
    ],
  },
  {
    id: 'skimming',
    icon: '04',
    title: 'Card Skimming',
    severity: 'MEDIUM',
    sev: 'zinc',
    summary: 'Physical or digital overlays capture card data at point-of-interaction.',
    how: 'Hardware skimmers are fitted over ATM card readers; digital equivalents (Magecart) are injected into e-commerce checkout JavaScript to exfiltrate card numbers in transit.',
    indicators: [
      'Loose, overlapping, or unusually thick card reader fascia',
      'Small authorisation charges before a large fraudulent one',
      'Online purchases appearing before the card is used in person',
    ],
  },
  {
    id: 'ato',
    icon: '05',
    title: 'Account Takeover',
    severity: 'CRITICAL',
    sev: 'red',
    summary: 'Credentials from breach databases are tested against banking portals at scale.',
    how: 'Automated tools try billions of username/password combos from leaked datasets against financial institutions. Successful logins are immediately monetised through wire transfers or mule accounts.',
    indicators: [
      'Login notification from an unrecognised device or geography',
      'Contact details or recovery email changed without your action',
      'New payee added or transfer limit modified',
    ],
  },
  {
    id: 'bec',
    icon: '06',
    title: 'Business Email Compromise',
    severity: 'HIGH',
    sev: 'amber',
    summary: 'Executive impersonation over email to redirect payments or exfiltrate data.',
    how: 'Attackers monitor email threads through inbox access or domain spoofing, inserting themselves at the moment a payment discussion happens. They redirect funds to mule accounts with convincing contextual replies.',
    indicators: [
      'Email from CEO/CFO requesting urgent, confidential wire transfer',
      'Slightly altered sender domain (rn vs m, zero vs o)',
      'Request to bypass normal finance approval channels',
    ],
  },
]

const PROTECTION_STEPS = [
  {
    n: '01',
    title: 'Hardware-backed 2FA',
    body: 'Replace SMS one-time codes with a TOTP authenticator app (Authy, 1Password) or a hardware key (YubiKey). SMS-based OTP is interceptable via SIM swap.',
  },
  {
    n: '02',
    title: 'Real-time transaction alerts',
    body: 'Enable push notifications for every transaction, regardless of amount. Set a £0 threshold. Report unrecognised charges within 48 hours to maximise chargeback success.',
  },
  {
    n: '03',
    title: 'Unique passwords via a manager',
    body: 'A password manager (Bitwarden, 1Password) generates and encrypts 20+ character random passwords for every site. Credential reuse is the root cause of 80% of account takeovers.',
  },
  {
    n: '04',
    title: 'Type URLs — never click links',
    body: 'Navigate to your bank by typing the URL directly. Legitimate banks never ask for your full password, card PIN, or OTP during an inbound call. Hang up and call back on the published number.',
  },
  {
    n: '05',
    title: 'Credit freeze',
    body: 'A freeze at all three bureaus prevents new credit being opened in your name. Free to place and lift. Do it preemptively — not after a breach.',
  },
]

const LIVE_SEED: Array<{ time: string; type: string; msg: string; ip: string; sev: string }> = [
  { time: '14:32:07', type: 'BLOCKED', msg: 'Credential stuffing — 847 attempts', ip: '185.220.101.x', sev: 'red' },
  { time: '14:31:55', type: 'FLAGGED', msg: 'Login from new country — MFA enforced', ip: '91.134.200.x', sev: 'amber' },
  { time: '14:31:42', type: 'BLOCKED', msg: 'Phishing link intercepted — session ended', ip: '45.142.212.x', sev: 'red' },
  { time: '14:31:30', type: 'REVIEW', msg: 'High-value transfer — pending manual review', ip: 'Internal', sev: 'zinc' },
  { time: '14:31:18', type: 'BLOCKED', msg: 'CNP fraud — card not present transaction declined', ip: '23.94.115.x', sev: 'red' },
  { time: '14:31:05', type: 'FLAGGED', msg: 'Password reset — identity re-verified', ip: '172.93.201.x', sev: 'amber' },
]

const RANDOM_MESSAGES = [
  'Anomalous velocity — 12 txns in 4 seconds blocked',
  'Dark-web credential match — user notified',
  'Synthetic identity fraud attempt detected',
  'Unusual API access pattern — rate limited',
  'Device fingerprint mismatch — step-up auth triggered',
  'Geolocation impossible travel — session terminated',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function useCounter(target: number, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const dur = 1800
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.floor(ease * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, target])
  return val
}

function formatStat(raw: number, n: number): string {
  if (raw >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (raw >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  if (raw < 10) return n.toFixed(1)
  return n.toLocaleString()
}

const sevLabel: Record<string, string> = {
  CRITICAL: 'tag-red',
  HIGH: 'tag-amber',
  MEDIUM: 'tag-zinc',
}
const alertColor: Record<string, string> = {
  BLOCKED: '#ef4444',
  FLAGGED: '#f59e0b',
  REVIEW: '#71717a',
}
const alertLeft: Record<string, string> = {
  BLOCKED: 'border-l-red-800',
  FLAGGED: 'border-l-amber-800',
  REVIEW: 'border-l-zinc-700',
}

// ─── Variants ────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

// ─── Components ─────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(0,0,0,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #111' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 12H1L7 1Z" fill="black" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Vigil</span>
          <span className="hidden md:inline text-zinc-700 text-sm">/</span>
          <span className="hidden md:inline text-zinc-500 text-sm">fraud-center</span>
        </div>

        {/* Nav */}
        <div className="hidden md:flex items-center gap-6 text-xs text-zinc-500">
          {['Threat Map', 'Fraud Types', 'Protect', 'Monitor'].map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(' ', '-')}`}
              className="hover:text-zinc-200 transition-colors duration-150"
            >
              {l}
            </a>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="status-dot live" />
          <span className="font-mono text-zinc-500 text-[11px]">All systems operational</span>
        </div>
      </div>
    </motion.nav>
  )
}

function Ticker() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  const colors: Record<string, string> = {
    CRIT: '#ef4444',
    WARN: '#f59e0b',
    INFO: '#52525b',
  }
  return (
    <div
      className="sticky top-14 z-40 mt-14 overflow-hidden py-2 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(0,0,0,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #111' : '1px solid transparent',
      }}
    >
      <div 
        className="animate-ticker flex gap-14 whitespace-nowrap"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)',
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span
              className="font-mono text-[10px] font-semibold tracking-widest"
              style={{ color: colors[item.type] }}
            >
              {item.type}
            </span>
            <span className="text-[11px] text-zinc-500">{item.msg}</span>
            <span className="text-[10px] text-zinc-700 font-mono">{item.loc}</span>
            <span className="text-zinc-800 mx-1">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  const [counter, setCounter] = useState(847293)
  const [globeReady, setGlobeReady] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => setCounter(c => c + Math.floor(Math.random() * 5) + 1), 1400)
    return () => clearInterval(iv)
  }, [])

  return (
    <section
      id="threat-map"
      className="relative min-h-[100vh] flex items-center overflow-hidden"
    >
      {/* Subtle grid bg */}
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />

      {/* Very subtle radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">

        {/* Left */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} >
            <span className="tag tag-red mb-5 inline-flex">
              <span className="status-dot alert" />
              Global threat level: HIGH
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
           
            className="text-white font-bold leading-[1.08] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)' }}
          >
            Digital banking fraud<br />
            <span className="text-zinc-500">in real time.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-zinc-500 text-base leading-relaxed mb-8 max-w-md">
            Fraud costs the global economy{' '}
            <span className="text-zinc-300">$485 billion annually</span>. This security
            centre monitors live threats across 195 countries — and shows you how to stay safe.
          </motion.p>

          {/* Live counter */}
          <motion.div
            variants={fadeUp}
           
            className="card rounded-xl p-5 mb-7 max-w-xs"
          >
            <div className="section-label mb-2">threats neutralised today</div>
            <div className="font-mono font-semibold text-white text-3xl tracking-tight tabular-nums">
              {counter.toLocaleString()}
            </div>
            <div className="font-mono text-[11px] text-zinc-600 mt-1.5">
              ↑ {(counter / 86400).toFixed(1)} / second average
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <a href="#fraud-types" className="btn-primary">
              Explore threats
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2.5 6h7m-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </a>
            <a href="#protect" className="btn-secondary">Security checklist</a>
          </motion.div>
        </motion.div>

        {/* Right — Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: globeReady ? 1 : 0.4, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-[480px] lg:h-[580px]"
        >
          {/* Radial glow behind globe */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(100,100,100,0.15) 0%, transparent 70%)',
            }}
          />

          <Globe onLoad={() => setGlobeReady(true)} />

          {/* Floating cards */}
          <motion.div
            className="absolute top-10 right-4 card rounded-xl p-3 backdrop-blur-sm text-xs"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="section-label mb-1.5">Active threat</div>
            <div className="text-white font-medium">Moscow → New York</div>
            <div className="text-zinc-600 font-mono text-[10px] mt-0.5">Credential stuffing</div>
          </motion.div>

          <motion.div
            className="absolute bottom-16 left-2 card rounded-xl p-3 backdrop-blur-sm text-xs"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          >
            <div className="section-label mb-1.5">Monitoring</div>
            <div className="text-white font-medium">14 threat clusters</div>
            <div className="text-zinc-600 font-mono text-[10px] mt-0.5">3.2M txn/sec</div>
          </motion.div>

          <motion.div
            className="absolute top-1/2 -translate-y-1/2 left-0 card rounded-xl p-3 backdrop-blur-sm text-xs"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="status-dot warn" />
              <span className="section-label">Alert — APAC</span>
            </div>
            <div className="text-white font-medium">Phishing surge</div>
            <div className="text-zinc-600 font-mono text-[10px] mt-0.5">+340% vs. 7d avg</div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000)' }}
      />
    </section>
  )
}

function StatCell({ s, inView, last }: { s: typeof STATS[0]; inView: boolean; last: boolean }) {
  const n = useCounter(s.value, inView)
  return (
    <motion.div
      variants={fadeUp}
      className="px-7 py-6"
      style={{ background: '#080808', borderRight: last ? 'none' : '1px solid #111' }}
    >
      <div className="section-label mb-3">{s.label}</div>
      <div className="stat-num mb-2">{formatStat(s.value, n)}{s.suffix}</div>
      <div className="font-mono text-[11px]" style={{ color: s.up ? '#4ade80' : '#ef4444' }}>
        {s.delta} vs yesterday
      </div>
    </motion.div>
  )
}

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-12 border-y" style={{ borderColor: '#111', background: '#050505' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ border: '1px solid #111', borderRadius: 12, overflow: 'hidden' }}
        >
          {STATS.map((s, i) => (
            <StatCell key={i} s={s} inView={inView} last={i === STATS.length - 1} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FraudTypesSection() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section id="fraud-types" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mb-14"
        >
          <motion.div variants={fadeUp}><div className="section-label mb-4">// threat intelligence</div></motion.div>
          <motion.h2 variants={fadeUp} className="text-white font-bold tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Know your attack surface.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-500 max-w-lg text-base">
            Six dominant fraud vectors targeting digital banking in 2024. Click any to expand the technical breakdown.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
        >
          {FRAUD_TYPES.map((f) => {
            const isOpen = open === f.id
            return (
              <motion.div
                key={f.id}
                variants={fadeUp}
               
                className="card rounded-xl overflow-hidden cursor-pointer select-none"
                onClick={() => setOpen(isOpen ? null : f.id)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-mono text-zinc-700 text-xs">{f.icon}</span>
                    <span className={`tag ${sevLabel[f.severity]}`}>{f.severity}</span>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.summary}</p>

                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-zinc-600">
                    <motion.span
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'inline-block' }}
                    >
                      ›
                    </motion.span>
                    {isOpen ? 'Collapse' : 'How it works'}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t" style={{ borderColor: '#111' }}>
                        <p className="text-zinc-400 text-sm leading-relaxed mt-4 mb-4">{f.how}</p>
                        <div className="section-label mb-2.5">Warning signs</div>
                        <ul className="space-y-2">
                          {f.indicators.map((ind, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-zinc-500">
                              <span className="text-zinc-700 mt-0.5 flex-shrink-0">—</span>
                              {ind}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function ProtectionSection() {
  return (
    <section id="protect" className="py-24 border-t" style={{ borderColor: '#111', background: '#050505' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16 items-start">
          {/* Sticky label side */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="lg:sticky lg:top-24"
          >
            <motion.div variants={fadeUp}><div className="section-label mb-4">// security protocol</div></motion.div>
            <motion.h2 variants={fadeUp} className="text-white font-bold tracking-tight mb-5" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
              Your defence playbook.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 text-base leading-relaxed mb-8">
              Five steps that reduce your exposure by over 95%. These aren't suggestions — treat them as mandatory controls.
            </motion.p>
            <motion.div variants={fadeUp}>
              <div
                className="card rounded-xl p-5"
              >
                <div className="section-label mb-3">Estimated risk reduction</div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Without any controls', pct: 100, color: '#ef4444' },
                    { label: 'With steps 1–2', pct: 62, color: '#f59e0b' },
                    { label: 'With all 5 steps', pct: 5, color: '#4ade80' },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-500">{r.label}</span>
                        <span className="font-mono" style={{ color: r.color }}>{r.pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: r.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${r.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-3"
          >
            {PROTECTION_STEPS.map((step) => (
              <motion.div
                key={step.n}
                variants={fadeUp}
               
                className="card rounded-xl p-6 flex gap-5"
              >
                <div className="font-mono text-zinc-700 text-xs mt-0.5 flex-shrink-0 w-6">{step.n}</div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MonitorSection() {
  const [feed, setFeed] = useState(LIVE_SEED)
  const [checks, setChecks] = useState<Record<string, boolean>>({
    '2FA enabled': true,
    'Tx alerts on': true,
    'Biometric login': true,
    'Credit frozen': false,
    'Password manager': false,
  })

  useEffect(() => {
    const iv = setInterval(() => {
      setFeed(prev => {
        const types = ['BLOCKED', 'FLAGGED', 'REVIEW']
        const type = types[Math.floor(Math.random() * types.length)]
        const entry = {
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type,
          msg: RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)],
          ip: `${Math.floor(Math.random() * 200 + 50)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.x`,
          sev: type === 'BLOCKED' ? 'red' : type === 'FLAGGED' ? 'amber' : 'zinc',
        }
        return [entry, ...prev.slice(0, 8)]
      })
    }, 3200)
    return () => clearInterval(iv)
  }, [])

  const score = Math.round(
    (Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100,
  )
  const scoreColor = score >= 80 ? '#4ade80' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <section id="monitor" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-14"
        >
          <motion.div variants={fadeUp}><div className="section-label mb-4">// live operations</div></motion.div>
          <motion.h2 variants={fadeUp} className="text-white font-bold tracking-tight" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Security at a glance.
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* Live feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="status-dot live" />
              <span className="font-mono text-[11px] text-zinc-500 tracking-wider">LIVE — updating every 3s</span>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #111', background: '#080808' }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor: '#111', background: '#050505' }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="font-mono text-zinc-700 text-[11px] ml-2">threat-feed.log</span>
              </div>

              <div className="p-3 space-y-1.5 min-h-[360px]">
                <AnimatePresence initial={false}>
                  {feed.map(alert => (
                    <motion.div
                      key={alert.time + alert.msg}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border-l-2 ${alertLeft[alert.type]}`}
                      style={{ background: 'rgba(255,255,255,0.015)' }}
                    >
                      <span
                        className="font-mono text-[11px] font-semibold flex-shrink-0 mt-0.5"
                        style={{ color: alertColor[alert.type] }}
                      >
                        {alert.type}
                      </span>
                      <span className="text-zinc-300 text-xs flex-1">{alert.msg}</span>
                      <div className="flex-shrink-0 text-right">
                        <div className="font-mono text-[10px] text-zinc-600">{alert.time}</div>
                        <div className="font-mono text-[10px] text-zinc-700 mt-0.5">{alert.ip}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Scorecard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            <div className="section-label mb-4">Personal security score</div>
            <div className="card rounded-xl p-6">
              {/* Ring */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#111" strokeWidth="6" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={scoreColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 264' }}
                      animate={{ strokeDasharray: `${(score / 100) * 264} 264` }}
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-semibold text-2xl text-white">{score}</span>
                    <span className="font-mono text-[10px] text-zinc-600">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-1">
                {Object.entries(checks).map(([label, done]) => (
                  <button
                    key={label}
                    onClick={() => setChecks(prev => ({ ...prev, [label]: !prev[label] }))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 hover:bg-white/[0.03]"
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                      style={{
                        background: done ? 'rgba(74,222,128,0.15)' : 'transparent',
                        border: done ? '1px solid rgba(74,222,128,0.4)' : '1px solid #222',
                      }}
                    >
                      <AnimatePresence>
                        {done && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            width="8" height="8" viewBox="0 0 8 8" fill="none"
                          >
                            <path d="M1.5 4L3 5.5 6.5 2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className={`text-sm ${done ? 'text-zinc-300' : 'text-zinc-600'}`}>{label}</span>
                    {!done && (
                      <span className="ml-auto tag tag-amber text-[10px] py-0.5">Enable</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t" style={{ borderColor: '#111' }}>
                <button className="btn-secondary w-full justify-center text-xs">
                  Run full security audit →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-10 border-t" style={{ borderColor: '#111', background: '#000' }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L9 9H1L5 1Z" fill="black" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Vigil</span>
        </div>

        <div className="font-mono text-[11px] text-zinc-700 text-center leading-relaxed">
          <span className="text-zinc-500">Team Name:</span> byte2light <span className="mx-2 text-zinc-800">|</span>{' '}
          <span className="text-zinc-500">Domain:</span> Finance &amp; Banking <span className="mx-2 text-zinc-800">|</span>{' '}
          <span className="text-zinc-500">Problem Code:</span> FIN-02
          <br />
          <span className="text-zinc-500">Members:</span> Arnav Mehta, Kaartik Salgotra, Teman Bansal
        </div>

        <div className="flex items-center gap-2">
          <span className="status-dot live" />
          <span className="font-mono text-[11px] text-zinc-600">All systems operational</span>
        </div>
      </div>
    </footer>
  )
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <Nav />
      <Ticker />
      <Hero />
      <StatsBar />
      <FraudTypesSection />
      <ProtectionSection />
      <MonitorSection />
      <Footer />
    </div>
  )
}
