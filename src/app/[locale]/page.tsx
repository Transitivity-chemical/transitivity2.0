'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, BookOpen, Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { TransitivityLogo } from '@/components/brand/TransitivityLogo';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/* ─── Fade-in ─────────────────────────────────────────────────────────── */

function FadeIn({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('fade-in-visible'), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref} className={`fade-in-hidden ${className}`}>{children}</div>;
}

/* ─── Hero background slideshow ───────────────────────────────────────── */

const HERO_IMAGES = [
  '/images/unb.jpg',
  '/images/ufg.jpg',
  '/images/ueg.jpg',
];

function HeroBackground() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === currentIdx ? 1 : 0,
          }}
        />
      ))}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[oklch(12%_0.01_250)]/75" />
    </div>
  );
}

/* ─── Inline SVG mockups for feature sections ─────────────────────────── */

function ArrheniusPlotMockup() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#111113] border border-[#222] shadow-sm shadow-black/40">
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28ca41]" />
        </div>
        <div className="ml-3 h-5 flex-1 max-w-[180px] rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center px-2">
          <span className="text-[9px] text-[#555]">transitivity.app/rate-constant</span>
        </div>
      </div>
      <div className="p-5">
        <svg viewBox="0 0 300 180" className="w-full">
          {/* Axes */}
          <line x1="40" y1="10" x2="40" y2="150" stroke="#333" strokeWidth="1" />
          <line x1="40" y1="150" x2="290" y2="150" stroke="#333" strokeWidth="1" />
          {/* Y label */}
          <text x="10" y="80" fill="#666" fontSize="9" transform="rotate(-90,15,80)">ln(k)</text>
          {/* X label */}
          <text x="155" y="170" fill="#666" fontSize="9" textAnchor="middle">1000/T (K⁻¹)</text>
          {/* Grid lines */}
          {[30, 60, 90, 120].map(y => (
            <line key={y} x1="40" y1={y} x2="290" y2={y} stroke="#1e1e1e" strokeWidth="0.5" />
          ))}
          {/* Classical TST line */}
          <polyline points="60,120 100,100 140,82 180,66 220,52 260,40" fill="none" stroke="#4a9eff" strokeWidth="2" />
          {/* Bell correction */}
          <polyline points="60,115 100,93 140,73 180,58 220,48 260,38" fill="none" stroke="#ff6b6b" strokeWidth="1.5" strokeDasharray="4,3" />
          {/* Eckart correction */}
          <polyline points="60,110 100,86 140,68 180,55 220,46 260,37" fill="none" stroke="#50c878" strokeWidth="1.5" strokeDasharray="6,3" />
          {/* Data points */}
          {[[60,118],[100,97],[140,78],[180,62],[220,50],[260,39]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#4a9eff" strokeWidth="1.5" />
          ))}
          {/* Legend */}
          <rect x="180" y="95" width="100" height="48" rx="4" fill="#111" stroke="#222" />
          <line x1="186" y1="106" x2="200" y2="106" stroke="#4a9eff" strokeWidth="2" />
          <text x="204" y="109" fill="#999" fontSize="7">Classical TST</text>
          <line x1="186" y1="118" x2="200" y2="118" stroke="#ff6b6b" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x="204" y="121" fill="#999" fontSize="7">Bell 1958</text>
          <line x1="186" y1="130" x2="200" y2="130" stroke="#50c878" strokeWidth="1.5" strokeDasharray="6,3" />
          <text x="204" y="133" fill="#999" fontSize="7">Eckart</text>
        </svg>
      </div>
      <div className="border-t border-[#1e1e1e] px-4 py-2">
        <span className="text-[11px] text-[#555]">Arrhenius Plot — Rate Constant Calculator</span>
      </div>
    </div>
  );
}

function FittingCurveMockup() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#111113] border border-[#222] shadow-sm shadow-black/40">
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28ca41]" />
        </div>
        <div className="ml-3 h-5 flex-1 max-w-[180px] rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center px-2">
          <span className="text-[9px] text-[#555]">transitivity.app/fitting</span>
        </div>
      </div>
      <div className="p-5">
        <svg viewBox="0 0 300 180" className="w-full">
          <line x1="40" y1="10" x2="40" y2="150" stroke="#333" strokeWidth="1" />
          <line x1="40" y1="150" x2="290" y2="150" stroke="#333" strokeWidth="1" />
          <text x="10" y="80" fill="#666" fontSize="9" transform="rotate(-90,15,80)">ln(k)</text>
          <text x="155" y="170" fill="#666" fontSize="9" textAnchor="middle">1000/T (K⁻¹)</text>
          {/* Experimental data points (scattered) */}
          {[[55,125],[75,112],[95,98],[115,88],[135,75],[155,68],[175,58],[195,50],[215,44],[235,38],[255,34],[275,30]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y + (i%3-1)*4} r="3.5" fill="none" stroke="#fff" strokeWidth="1.5" />
          ))}
          {/* Arrhenius fit (straight line) */}
          <line x1="50" y1="130" x2="280" y2="25" stroke="#ff6b6b" strokeWidth="1.5" opacity="0.7" />
          {/* Aquilanti-Mundim fit (curve - better fit) */}
          <path d="M50,128 Q90,105 130,78 T210,42 T280,28" fill="none" stroke="#4a9eff" strokeWidth="2" />
          {/* R² labels */}
          <rect x="180" y="90" width="105" height="50" rx="4" fill="#111" stroke="#222" />
          <line x1="186" y1="103" x2="200" y2="103" stroke="#ff6b6b" strokeWidth="1.5" />
          <text x="204" y="106" fill="#999" fontSize="7">Arrhenius R²=0.987</text>
          <line x1="186" y1="117" x2="200" y2="117" stroke="#4a9eff" strokeWidth="2" />
          <text x="204" y="120" fill="#999" fontSize="7">Aquilanti R²=0.999</text>
          <circle cx="193" cy="131" r="3" fill="none" stroke="#fff" strokeWidth="1.5" />
          <text x="204" y="134" fill="#999" fontSize="7">Experimental</text>
        </svg>
      </div>
      <div className="border-t border-[#1e1e1e] px-4 py-2">
        <span className="text-[11px] text-[#555]">Model Comparison — GSA Fitting Engine</span>
      </div>
    </div>
  );
}

function MolecularMockup() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#111113] border border-[#222] shadow-sm shadow-black/40">
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28ca41]" />
        </div>
        <div className="ml-3 h-5 flex-1 max-w-[180px] rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center px-2">
          <span className="text-[9px] text-[#555]">transitivity.app/ml</span>
        </div>
      </div>
      <div className="p-5 flex gap-4 items-start">
        <img src="/images/molecule-tspp.png" alt="Molecule" className="h-[140px] w-auto rounded object-contain" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="rounded-md bg-[#161616] border border-[#222] p-3">
            <p className="text-[10px] text-[#50c878] font-mono mb-1">ANI-2x Result</p>
            <div className="h-px bg-[#222] mb-2" />
            <p className="text-[9px] text-[#888]">Energy</p>
            <p className="text-[11px] text-[#4a9eff] font-mono">-307.4821 Ha</p>
            <p className="text-[9px] text-[#888] mt-1.5">Forces (max)</p>
            <p className="text-[11px] text-[#50c878] font-mono">0.00032 Ha/Å</p>
          </div>
          <div className="rounded-md bg-[#161616] border border-[#222] px-3 py-2">
            <span className="text-[10px] text-[#50c878]">✓ Converged</span>
            <span className="text-[9px] text-[#666] ml-2">12 atoms • 0.8s</span>
          </div>
        </div>
      </div>
      <div className="border-t border-[#1e1e1e] px-4 py-2">
        <span className="text-[11px] text-[#555]">Neural Network Potential — ML Predict</span>
      </div>
    </div>
  );
}

function PlatformOverviewMockup() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#111113] border border-[#222] shadow-sm shadow-black/40">
      <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28ca41]" />
        </div>
        <div className="ml-3 h-5 flex-1 max-w-[180px] rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center px-2">
          <span className="text-[9px] text-[#555]">transitivity.app/dashboard</span>
        </div>
      </div>
      <div className="flex">
        {/* Mini sidebar */}
        <div className="w-[52px] shrink-0 border-r border-[#1e1e1e] bg-[#0d0d0f] py-3 flex flex-col items-center gap-3">
          <div className="h-5 w-5 rounded bg-[#1e3a5f] flex items-center justify-center">
            <span className="text-[7px] text-white font-bold">γ</span>
          </div>
          {[0,1,2,3,4].map(i => (
            <div key={i} className={`h-4 w-4 rounded ${i === 0 ? 'bg-[#1e3a5f]/40' : 'bg-[#1a1a1a]'}`} />
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-[#161616] border border-[#222] p-2">
              <p className="text-[8px] text-[#666]">Calculations</p>
              <p className="text-[12px] text-[#4a9eff] font-mono font-bold">247</p>
            </div>
            <div className="rounded-md bg-[#161616] border border-[#222] p-2">
              <p className="text-[8px] text-[#666]">Models Fit</p>
              <p className="text-[12px] text-[#50c878] font-mono font-bold">18</p>
            </div>
            <div className="rounded-md bg-[#161616] border border-[#222] p-2">
              <p className="text-[8px] text-[#666]">ML Jobs</p>
              <p className="text-[12px] text-[#ff6b6b] font-mono font-bold">5</p>
            </div>
          </div>
          {/* Mini chart */}
          <div className="rounded-md bg-[#161616] border border-[#222] p-3">
            <p className="text-[9px] text-[#666] mb-2">Recent Activity</p>
            <svg viewBox="0 0 200 50" className="w-full">
              <polyline points="0,40 20,35 40,38 60,25 80,30 100,15 120,20 140,10 160,18 180,8 200,12" fill="none" stroke="#1e3a5f" strokeWidth="1.5" />
            </svg>
          </div>
          {/* Feature pills */}
          <div className="flex flex-wrap gap-1.5">
            {['TST', 'Bell', 'Eckart', 'GSA', 'ANI-2x', 'CPMD'].map(tag => (
              <span key={tag} className="rounded-md bg-[#1e3a5f]/20 px-2 py-0.5 text-[8px] text-[#4a9eff] border border-[#1e3a5f]/30">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#1e1e1e] px-4 py-2">
        <span className="text-[11px] text-[#555]">Platform Dashboard — Transitivity 2.0</span>
      </div>
    </div>
  );
}

/* ─── Tool icons for trust bar ────────────────────────────────────────── */

type TrustItem = {
  src: string;
  alt: string;
  height: number;
  label?: string;
};

const TRUST_ITEMS: TrustItem[] = [
  { src: '/images/gaussian-logo.png', alt: 'Gaussian', height: 40 },
  { src: '/images/mlatom-logo.png', alt: 'MLatom', height: 32, label: 'MLatom' },
  { src: '/images/scipy-logo.svg', alt: 'SciPy', height: 36, label: 'SciPy' },
  { src: '/images/unb-logo.png', alt: 'UnB', height: 32 },
  { src: '/images/ueg-logo.png', alt: 'UEG', height: 48 },
];

function TrustLogo({ item }: { item: TrustItem }) {
  return (
    <div className="flex items-center gap-2">
      <img src={item.src} alt={item.alt} style={{ height: item.height }} className="w-auto object-contain" />
      {item.label && (
        <span className="text-[12px] font-medium tracking-tight text-[#6b7280]">{item.label}</span>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const headerRef = useRef<HTMLElement>(null);
  const locale = useLocale();
  const t = useTranslations('landing');
  const tc = useTranslations('common');
  const tCourse = useTranslations('course');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current;
      if (!header) return;
      if (window.scrollY > 60) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      tag: t('featRateTag'),
      title: t('featRateTitle'),
      desc: t('featRateDesc'),
      bullets: [t('featRateB1'), t('featRateB2'), t('featRateB3'), t('featRateB4')],
      mockup: <ArrheniusPlotMockup />,
      flip: false,
    },
    {
      tag: t('featFitTag'),
      title: t('featFitTitle'),
      desc: t('featFitDesc'),
      bullets: [t('featFitB1'), t('featFitB2'), t('featFitB3'), t('featFitB4')],
      mockup: <FittingCurveMockup />,
      flip: true,
    },
    {
      tag: t('featMlTag'),
      title: t('featMlTitle'),
      desc: t('featMlDesc'),
      bullets: [t('featMlB1'), t('featMlB2'), t('featMlB3'), t('featMlB4')],
      mockup: <MolecularMockup />,
      flip: false,
    },
  ];

  const steps = [
    { number: '1', title: t('step1Title'), desc: t('step1Desc') },
    { number: '2', title: t('step2Title'), desc: t('step2Desc') },
    { number: '3', title: t('step3Title'), desc: t('step3Desc') },
  ];

  const plans = [
    {
      name: t('planFree'), price: t('planFreePrice'), period: t('planFreePeriod'),
      desc: t('planFreeDesc'), highlighted: false,
      features: locale === 'pt-BR'
        ? ['Até 50 cálculos/mês', 'Todos os métodos de tunelamento', 'Ajuste GSA (3 modelos)', 'Predições ML básicas', 'Exportação CSV']
        : ['Up to 50 calculations/month', 'All TST tunneling methods', 'GSA fitting (3 models)', 'Basic ML predictions', 'CSV export'],
    },
    {
      name: t('planPro'), price: t('planProPrice'), period: t('planProPeriod'),
      desc: t('planProDesc'), highlighted: true,
      features: locale === 'pt-BR'
        ? ['Cálculos ilimitados', 'Todos os 6 modelos de ajuste', 'Todos os potenciais ML + otimização', 'Fila de computação prioritária', 'Assistente IA de Química', 'Processamento em lote']
        : ['Unlimited calculations', 'All 6 fitting models', 'All ML potentials + optimization', 'Priority compute queue', 'AI Chemistry Assistant', 'Batch processing'],
    },
    {
      name: t('planEnterprise'), price: t('planEnterprisePrice'), period: t('planEnterprisePeriod'),
      desc: t('planEnterpriseDesc'), highlighted: false,
      features: locale === 'pt-BR'
        ? ['Tudo do Pro', 'Workspaces multi-usuário', 'Integrações customizadas', 'Suporte dedicado', 'Implantação on-premise', 'SLA garantido']
        : ['Everything in Pro', 'Multi-user workspaces', 'Custom integrations', 'Dedicated support', 'On-premise deployment option', 'SLA guarantee'],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[13px]">
      <style>{`
        .fade-in-hidden { opacity: 0; transform: translateY(24px); }
        .fade-in-visible {
          opacity: 1; transform: translateY(0);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .header-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          background-color: transparent;
          border-bottom: 1px solid transparent;
        }
        .header-bar .header-logo, .header-bar .header-nav-link, .header-bar .header-cta { color: #ffffff; }
        .header-bar .header-nav-link { opacity: 0.7; }
        .header-bar .header-nav-link:hover { opacity: 1; }
        .header-bar .header-cta { border-color: rgba(255,255,255,0.3); }
        .header-bar .header-cta:hover { background-color: rgba(255,255,255,0.1); }
        .header-bar .header-register { opacity: 0.95; }
        .header-bar .header-register:hover { opacity: 1; }
        .header-bar.header-scrolled {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-bottom-color: #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .header-bar.header-scrolled .header-logo { color: #0a0a0a; }
        .header-bar.header-scrolled .header-nav-link { color: #6b7280; opacity: 1; }
        .header-bar.header-scrolled .header-nav-link:hover { color: #0a0a0a; }
        .header-bar.header-scrolled .header-cta {
          background-color: transparent; color: #1e3a5f; border-color: #1e3a5f;
        }
        .header-bar.header-scrolled .header-cta:hover {
          background-color: #1e3a5f; color: #ffffff;
        }
        .header-bar.header-scrolled .header-register {
          background-color: #1e3a5f; color: #ffffff;
        }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header ref={headerRef} className="header-bar">
        <div className="relative mx-auto flex max-w-7xl items-center px-6 py-4 lg:px-12">
          <Link href={`/${locale}`} className="header-logo transition-colors">
            <TransitivityLogo size="md" color="currentColor" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="ml-auto rounded-md border border-white/20 p-2 text-white transition-all hover:bg-white/10 sm:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 sm:flex">
            <a href="#about" className="header-nav-link text-[12px] transition-colors">{t('navAbout')}</a>
            <a href="#features" className="header-nav-link text-[12px] transition-colors">{t('navFeatures')}</a>
            <a href="#pricing" className="header-nav-link text-[12px] transition-colors">{t('navPricing')}</a>
            <Link href={`/${locale}/course`} className="header-nav-link text-[12px] transition-colors">{tCourse('landingCta')}</Link>
          </nav>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <Link href={`/${locale}/login`} className="header-cta rounded-md border px-5 py-2 text-[12px] font-medium transition-all">
              {t('navSignIn')}
            </Link>
            <Link href={`/${locale}/register`} className="header-register rounded-md bg-[#1e3a5f] px-5 py-2 text-[12px] font-semibold text-white transition-all hover:bg-[#2a4f7f]">
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[86vw] max-w-xs border-l p-0 sm:hidden">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle className="text-[14px]">Transitivity 2.0</SheetTitle>
          </SheetHeader>

          <div className="space-y-3 px-5 py-5">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-[12px] font-medium text-foreground hover:bg-accent"
            >
              {t('navAbout')}
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-[12px] font-medium text-foreground hover:bg-accent"
            >
              {t('navFeatures')}
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-[12px] font-medium text-foreground hover:bg-accent"
            >
              {t('navPricing')}
            </a>
            <Link
              href={`/${locale}/course`}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-[12px] font-medium text-foreground hover:bg-accent"
            >
              {tCourse('landingCta')}
            </Link>

            <div className="border-t pt-4">
              <Link
                href={`/${locale}/login`}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md border px-4 py-3 text-center text-[12px] font-medium text-[#1e3a5f] transition-all hover:bg-accent"
              >
                {t('navSignIn')}
              </Link>
              <Link
                href={`/${locale}/register`}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 block rounded-md bg-[#1e3a5f] px-4 py-3 text-center text-[12px] font-semibold text-white transition-all hover:bg-[#2a4f7f]"
              >
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <HeroBackground />
        <div className="relative z-10 mx-auto max-w-4xl pt-16 pb-24">
          <FadeIn>
            <TransitivityLogo size="xl" className="mx-auto mb-5 text-white/95" />
          </FadeIn>
          <FadeIn delay={80}>
            <h1
              className="font-semibold tracking-tight text-[#fafafa]"
              style={{ fontSize: 'clamp(2.5rem, 4vw + 1rem, 4.5rem)', lineHeight: '1.08', letterSpacing: '-0.025em' }}
            >
              {t('heroTitle')}
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="mt-4 text-[14px] font-medium text-[#d4dce9] tracking-tight">{t('heroSubtitle')}</p>
          </FadeIn>
          <FadeIn delay={240}>
            <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-[#dfe6f3]">{t('heroDescription')}</p>
          </FadeIn>
          <FadeIn delay={350}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href={`/${locale}/register`} className="group inline-flex items-center justify-center gap-2 rounded-md bg-[#1e3a5f] px-8 py-4 text-[12px] font-semibold text-white transition-all hover:bg-[#2a4f7f]">
                {t('getStarted')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#demo" className="inline-flex items-center justify-center rounded-md border border-white/30 px-8 py-4 text-[12px] font-semibold text-white transition-all hover:border-[#1e3a5f] hover:bg-white/5">
                {t('requestDemo')}
              </a>
            </div>
          </FadeIn>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10" />
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="border-b border-[#e5e7eb] bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#a1a1a1]">{t('trustLine')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-10 sm:gap-14">
            {TRUST_ITEMS.map((item) => (
              <TrustLogo key={item.alt} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="bg-white px-6 py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <FadeIn>
              <div>
                <h2 className="font-semibold tracking-tight text-[#0a0a0a]" style={{ fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
                  {t('aboutTitle')}
                </h2>
                <p className="mt-6 text-[13px] leading-[1.7] text-[#4b5563] sm:text-[14px]">{t('aboutP1')}</p>
                <p className="mt-4 text-[13px] leading-[1.7] text-[#4b5563]">{t('aboutP2')}</p>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <PlatformOverviewMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <div id="features">
        {features.map((feature, idx) => {
          const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]';
          return (
            <section key={feature.tag} className={`${bgClass} px-6 py-24 lg:px-12 lg:py-28`}>
              <div className="mx-auto max-w-6xl">
                <div className={`grid items-center gap-16 lg:grid-cols-2 ${feature.flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                  <FadeIn>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1e3a5f]">{feature.tag}</span>
                      <h3 className="mt-4 font-semibold tracking-tight text-[#0a0a0a]" style={{ fontSize: 'clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem)', lineHeight: '1.2', letterSpacing: '-0.015em' }}>
                        {feature.title}
                      </h3>
                      <p className="mt-4 text-[13px] leading-[1.7] text-[#4b5563]">{feature.desc}</p>
                      <ul className="mt-8 space-y-3">
                        {feature.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3 text-[12px] text-[#374151]">
                            <Check size={16} className="mt-0.5 shrink-0 text-[#6b7280]" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                  <FadeIn delay={100}>{feature.mockup}</FadeIn>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-[#fafafa] px-6 py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-semibold tracking-tight text-[#0a0a0a]" style={{ fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
                {t('howTitle')}
              </h2>
              <p className="mt-4 text-[13px] text-[#4b5563]">{t('howSubtitle')}</p>
            </div>
          </FadeIn>
          <div className="relative mt-20">
            <div aria-hidden className="absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px bg-[#e5e7eb] lg:block" />
            <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
              {steps.map((step, idx) => (
                <FadeIn key={step.number} delay={idx * 150}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-lg bg-white border border-[#e5e7eb]">
                      <span className="font-semibold text-[#1e3a5f]" style={{ fontSize: '1.5rem' }}>{step.number}</span>
                    </div>
                    <h3 className="mt-6 text-[14px] font-semibold text-[#0a0a0a]">{step.title}</h3>
                    <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-[#4b5563]">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEMO ═══ */}
      <section id="demo" className="bg-[#0a0a0a] px-6 py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <h2 className="font-semibold tracking-tight text-[#fafafa]" style={{ fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
              {t('demoTitle')}
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="mt-3 text-[13px] text-[#c0c6d4]">{t('demoSubtitle')}</p>
          </FadeIn>
          <FadeIn delay={200}>
            <form className="mt-12 space-y-4 text-left" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="demo-name" className="mb-1.5 block text-[12px] font-medium text-[#a1a1a1]">{t('demoName')}</label>
                <input id="demo-name" type="text" placeholder={t('demoNamePlaceholder')} className="w-full rounded-md border border-[#333] bg-[#1a1a1a] px-4 py-3 text-[12px] text-white placeholder-[#555] outline-none transition-colors focus:border-[#1e3a5f]" />
              </div>
              <div>
                <label htmlFor="demo-email" className="mb-1.5 block text-[12px] font-medium text-[#a1a1a1]">{t('demoEmail')}</label>
                <input id="demo-email" type="email" placeholder={t('demoEmailPlaceholder')} className="w-full rounded-md border border-[#333] bg-[#1a1a1a] px-4 py-3 text-[12px] text-white placeholder-[#555] outline-none transition-colors focus:border-[#1e3a5f]" />
              </div>
              <div>
                <label htmlFor="demo-inst" className="mb-1.5 block text-[12px] font-medium text-[#a1a1a1]">{t('demoInstitution')}</label>
                <input id="demo-inst" type="text" placeholder={t('demoInstitutionPlaceholder')} className="w-full rounded-md border border-[#333] bg-[#1a1a1a] px-4 py-3 text-[12px] text-white placeholder-[#555] outline-none transition-colors focus:border-[#1e3a5f]" />
              </div>
              <button type="submit" className="mt-4 w-full rounded-md bg-[#1e3a5f] px-8 py-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#2a4f7f]">
                {t('demoSubmit')}
              </button>
            </form>
          </FadeIn>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="bg-white px-6 py-24 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-semibold tracking-tight text-[#0a0a0a]" style={{ fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
                {t('pricingTitle')}
              </h2>
              <p className="mt-4 text-[13px] text-[#4b5563]">{t('pricingSubtitle')}</p>
          </div>
        </FadeIn>
        <div className="mt-16 grid items-start gap-6 sm:grid-cols-3">
          {plans.map((plan, idx) => (
            <FadeIn key={plan.name} delay={idx * 100}>
              <div className={`relative flex flex-col rounded-lg border p-8 shadow-sm shadow-black/5 ${plan.highlighted ? 'border-t-[3px] border-t-[#1e3a5f] border-x-[#e5e7eb] border-b-[#e5e7eb] bg-white' : 'border-[#e5e7eb] bg-white'}`}>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0a0a0a]">{plan.name}</h3>
                    <p className="mt-1 text-[11px] text-[#a1a1a1]">{plan.desc}</p>
                    <div className="mt-6 flex items-end gap-1">
                      <span className="font-semibold leading-none text-[#0a0a0a]" style={{ fontSize: '2.25rem', letterSpacing: '-0.025em' }}>{plan.price}</span>
                      <span className="mb-1 text-[11px] text-[#a1a1a1]">/{plan.period}</span>
                    </div>
                  </div>
                  <div className="my-6 h-px bg-[#e5e7eb]" />
                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-[12px]">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#a1a1a1]" />
                        <span className="text-[#374151]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={`/${locale}/register`} className={`block w-full rounded-md py-3 text-center text-[12px] font-medium transition-colors ${plan.highlighted ? 'bg-[#1e3a5f] text-white hover:bg-[#2a4f7f]' : 'border border-[#e5e7eb] text-[#6b7280] hover:border-[#1e3a5f] hover:text-[#1e3a5f]'}`}>
                      {t('planGetStarted')}
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COURSE CTA ═══ */}
      <section className="bg-[#fafafa] px-6 py-24 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 sm:p-12 flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-start lg:gap-12 shadow-sm shadow-black/5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]">
                <BookOpen size={28} className="text-white" />
              </div>
              <div className="mt-6 lg:mt-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-[#0a0a0a] sm:text-2xl">{tCourse('landingCta')}</h3>
                <p className="mt-3 text-[13px] leading-[1.7] text-[#4b5563]">{tCourse('landingCtaDesc')}</p>
                <div className="mt-6">
                  <Link href={`/${locale}/course`} className="group inline-flex items-center gap-2 rounded-md bg-[#1e3a5f] px-6 py-3 text-[12px] font-semibold text-white transition-all hover:bg-[#2a4f7f]">
                    {tCourse('ctaExplore')}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-gray-200 bg-white px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <TransitivityLogo size="sm" color="#0a0a0a" />
              <ul className="mt-4 space-y-2 text-[12px] text-gray-600">
                <li><Link href={`/${locale}/login`} className="hover:text-gray-900 transition-colors">{t('navSignIn')}</Link></li>
                <li><Link href={`/${locale}/register`} className="hover:text-gray-900 transition-colors">{tc('appName')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-gray-900">{t('footerFeatures')}</h3>
              <ul className="mt-3 space-y-2 text-[12px] text-gray-600">
                <li>{t('featRateTag')}</li>
                <li>{t('featFitTag')}</li>
                <li>{t('featMlTag')}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-gray-900">{t('footerResearch')}</h3>
              <ul className="mt-3 space-y-2 text-[12px] text-gray-600">
                <li><a href="https://www.unb.br" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">{t('footerUnB')}</a></li>
                <li><Link href={`/${locale}/course`} className="hover:text-gray-900 transition-colors">{tCourse('landingCta')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-gray-900">{t('footerContact')}</h3>
              <ul className="mt-3 space-y-2 text-[12px] text-gray-600">
                <li>transitivity@unb.br</li>
                <li>Campus Darcy Ribeiro</li>
                <li>Brasilia — DF</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-100 pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-gray-400">&copy; {new Date().getFullYear()} {t('footerCopyright')}</p>
            <div className="flex gap-4 text-[11px] text-gray-400">
              <span>Terms</span>
              <span>Privacy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
