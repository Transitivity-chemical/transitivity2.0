'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, ExternalLink, BookOpen, Github, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { TransitivityLogo } from '@/components/brand/TransitivityLogo';

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

/* ─── Colab Notebook Card ─────────────────────────────────────────────── */

function ColabCard({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 transition-all hover:border-[#1e3a5f] hover:shadow-md"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f9ab00] to-[#e37400]">
        <BookOpen size={18} className="text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-[#374151] group-hover:text-[#1e3a5f]">{label}</span>
      <ExternalLink size={14} className="shrink-0 text-[#a1a1a1] transition-colors group-hover:text-[#1e3a5f]" />
    </a>
  );
}

/* ─── YouTube Embed ───────────────────────────────────────────────────── */

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[#e5e7eb] shadow-lg" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/* ─── Module Section ──────────────────────────────────────────────────── */

function ModuleSection({
  moduleNumber,
  title,
  description,
  notes,
  notebooks,
  videoId,
  bgClass,
}: {
  moduleNumber: number;
  title: string;
  description: string;
  notes: string[];
  notebooks: { label: string; href: string }[];
  videoId: string;
  bgClass: string;
}) {
  return (
    <section className={`${bgClass} px-6 py-24 lg:px-12 lg:py-32`}>
      <div className="mx-auto max-w-6xl">
        {/* Module header */}
        <FadeIn>
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-[#1e3a5f]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#1e3a5f]">
              Module {moduleNumber}
            </span>
            <h3
              className="mt-4 font-semibold tracking-tight text-[#0a0a0a]"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem)', lineHeight: '1.2', letterSpacing: '-0.015em' }}
            >
              {title}
            </h3>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#6b7280]">{description}</p>
          </div>
        </FadeIn>

        {/* Video */}
        <FadeIn delay={100}>
          <div className="mx-auto mb-12 max-w-4xl">
            <YouTubeEmbed videoId={videoId} />
          </div>
        </FadeIn>

        {/* Notebooks + Notes side by side */}
        <div className="grid gap-12 lg:grid-cols-2">
          <FadeIn delay={200}>
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#374151]">
                <BookOpen size={16} />
                Notebooks
              </h4>
              <div className="space-y-3">
                {notebooks.map((nb) => (
                  <ColabCard key={nb.href} label={nb.label} href={nb.href} />
                ))}
              </div>
            </div>
          </FadeIn>

          {notes.length > 0 && (
            <FadeIn delay={300}>
              <div>
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#374151]">
                  <FileText size={16} />
                  Notes
                </h4>
                <ul className="space-y-3">
                  {notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-xs font-semibold text-[#1e3a5f]">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-[#374151]">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function CoursePage() {
  const headerRef = useRef<HTMLElement>(null);
  const locale = useLocale();
  const t = useTranslations('course');

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

  const modules = [
    {
      title: t('mod1Title'),
      description: t('mod1Desc'),
      videoId: 'aircAruvnKk',
      notes: [t('mod1Note1'), t('mod1Note2'), t('mod1Note3')],
      notebooks: [
        { label: t('mod1Nb1'), href: 'https://colab.research.google.com/drive/1TG383Snn-Ny6kKJqCLe87O1BQAESlDX3?usp=sharing' },
      ],
    },
    {
      title: t('mod2Title'),
      description: t('mod2Desc'),
      videoId: 'VyWAvY2CF9c',
      notes: [t('mod2Note1'), t('mod2Note2'), t('mod2Note3')],
      notebooks: [
        { label: t('mod2Nb1'), href: 'https://colab.research.google.com/drive/1XYWt3LtytgVN0kiCyFZg30YkSi_R2-YI?usp=sharing' },
      ],
    },
    {
      title: t('mod3Title'),
      description: t('mod3Desc'),
      videoId: 'cWIeTMklzNg',
      notes: [t('mod3Note1'), t('mod3Note2'), t('mod3Note3')],
      notebooks: [
        { label: t('mod3Nb1'), href: 'https://colab.research.google.com/drive/1PTxoDSXq0Qhk9Vg-FUqL86G1-AZm4nbd?usp=sharing' },
        { label: t('mod3Principal'), href: 'https://colab.research.google.com/drive/10qTME_5WbxBbW8ZRlsMeDrgd2L7bxdBR' },
        { label: t('mod3Smart'), href: 'https://colab.research.google.com/drive/1G3uHQoAtKif5aK5SEWx4aeD4RLse9ULd' },
        { label: t('mod3Solubility'), href: 'https://colab.research.google.com/drive/1GvIVxnCu9yUNsWWNbW0JhucfkIRthtV3' },
      ],
    },
    {
      title: t('mod4Title'),
      description: t('mod4Desc'),
      videoId: 'KuXjwB4LzSA',
      notes: [t('mod4Note1'), t('mod4Note2'), t('mod4Note3')],
      notebooks: [
        { label: t('mod4Nb1'), href: 'https://colab.research.google.com/drive/1QUNA9379W-xNO30c_hLpjBOTwHwmsC16' },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-white">
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
      `}</style>

      {/* === HEADER === */}
      <header ref={headerRef} className="header-bar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <Link href={`/${locale}`} className="header-logo transition-colors">
            <TransitivityLogo size="sm" color="currentColor" />
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <Link href={`/${locale}`} className="header-nav-link text-sm transition-colors">{t('navHome')}</Link>
            <a href="#modules" className="header-nav-link text-sm transition-colors">{t('navModules')}</a>
          </nav>
          <a
            href="https://github.com/UnB-CIS/UnB-CIS-UEG-MPhysChem"
            target="_blank"
            rel="noopener noreferrer"
            className="header-cta rounded-lg border px-5 py-2 text-sm font-medium transition-all inline-flex items-center gap-2"
          >
            <Github size={16} />
            GitHub
          </a>
        </div>
      </header>

      {/* === HERO === */}
      <section className="relative flex min-h-[85svh] flex-col items-center justify-center px-6 text-center bg-[#0a0a0a]">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, #1e3a5f 0%, transparent 50%), radial-gradient(circle at 75% 75%, #2a4f7f 0%, transparent 50%)',
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl pt-16 pb-24">
          <FadeIn>
            <div className="mx-auto mb-6 flex items-center justify-center gap-3">
              <span className="rounded-full bg-[#1e3a5f]/30 border border-[#1e3a5f]/50 px-4 py-1.5 text-xs font-medium text-[#7eb8ff]">
                {t('badge')}
              </span>
            </div>
          </FadeIn>
          <FadeIn delay={50}>
            <h1
              className="font-semibold tracking-tight text-[#fafafa]"
              style={{ fontSize: 'clamp(2rem, 4vw + 0.5rem, 3.5rem)', lineHeight: '1.12', letterSpacing: '-0.025em' }}
            >
              {t('heroTitle')}
            </h1>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="mt-4 text-lg italic text-[#a1a1a1]">{t('heroSubtitle')}</p>
          </FadeIn>
          <FadeIn delay={250}>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-[#c0c0c0] sm:text-lg">{t('heroDescription')}</p>
          </FadeIn>
          <FadeIn delay={350}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#modules"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#2a4f7f]"
              >
                {t('ctaExplore')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="https://github.com/UnB-CIS/UnB-CIS-UEG-MPhysChem"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/5"
              >
                <Github size={18} />
                {t('ctaGithub')}
              </a>
            </div>
          </FadeIn>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10" />
      </section>

      {/* === MODULES === */}
      <div id="modules">
        {modules.map((mod, idx) => (
          <ModuleSection
            key={idx}
            moduleNumber={idx + 1}
            title={mod.title}
            description={mod.description}
            notes={mod.notes}
            notebooks={mod.notebooks}
            videoId={mod.videoId}
            bgClass={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}
          />
        ))}
      </div>

      {/* === FOOTER === */}
      <footer className="border-t border-gray-200 bg-white px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <Link href={`/${locale}`}>
              <TransitivityLogo size="sm" color="#0a0a0a" />
            </Link>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/UnB-CIS/UnB-CIS-UEG-MPhysChem"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                GitHub
              </a>
              <Link
                href={`/${locale}`}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Transitivity 2.0
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Transitivity 2.0 &mdash; University of Brasilia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
