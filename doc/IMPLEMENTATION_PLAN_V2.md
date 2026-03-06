# Transitivity 2.0 — Implementation Plan V2

**Date:** 2026-03-06
**Status:** PENDING APPROVAL
**Author:** Claude (AI) + Pedro (PM)

---

## Table of Contents

1. [Quick Fixes (Trivial, No Planning Needed)](#1-quick-fixes)
2. [Gamma Logo Redesign](#2-gamma-logo)
3. [Landing Page Fixes](#3-landing-page)
4. [Login & Register Pages](#4-auth-pages)
5. [Course Page Overhaul](#5-course-page)
6. [AI Chat — API Key & Floating Chat](#6-ai-chat)
7. [Dashboard Content Enrichment](#7-dashboard)
8. [New Sidebar Pages: Server Status & Wiki](#8-new-pages)
9. [Outdated Chemistry Icons Audit](#9-chemistry-icons)
10. [ASKCOS / Ketcher Molecule Drawing (Future)](#10-askcos-ketcher)
11. [Comprehensive Test Suite](#11-testing)

---

## 1. Quick Fixes

Trivial changes that can be done immediately without further planning.

### Task 1.1 — Replace OpenRouter API Key
- **File:** `web/.env`
- **Action:** Replace `OPENROUTER_API_KEY` value with `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`
- **Fixes:** HTTP 402 error on chat

### Task 1.2 — Fix `loginBranding.demoNamePlaceholder` Error
- **File:** `src/app/[locale]/(auth)/register/page.tsx:81`
- **Problem:** Uses `tb('demoNamePlaceholder' as never)` where `tb = useTranslations('loginBranding')`, but `demoNamePlaceholder` only exists in the `landing` namespace
- **Fix:** Either add `demoNamePlaceholder` to `loginBranding` in both locale files, or just hardcode the placeholder string / use `t('fullName')` as placeholder
- **Recommended:** Add key to `loginBranding` in both `en.json` and `pt-BR.json`

### Task 1.3 — Remove Comma from Hero Title
- **Files:** `src/messages/pt-BR.json`, `src/messages/en.json`
- **Action:** Change `"heroTitle"` from `"Química computacional, simplificada"` to `"Química computacional simplificada"` (and equivalent in English if it has a comma)

---

## 2. Gamma Logo Redesign

### Problem
Current `GammaIcon` in `src/components/brand/TransitivityLogo.tsx` renders a V-with-tail using stroked paths. The user wants a **filled calligraphic lowercase gamma (γ)** matching the reference image `~/Downloads/gamablue.png`:
- Hook curving up-left at top-left
- Two strokes crossing and forming a filled teardrop/loop in the center
- Descending tail ending in a teardrop/bulb

### Task 2.1 — Create Proper Calligraphic γ SVG
- **Approach A (Recommended):** Use `gamablue.png` as source, trace it with a tool like Inkscape/Potrace to generate a clean SVG path, then embed the path data into the `GammaIcon` component as a **filled** `<path>` (not stroked).
- **Approach B:** Hand-craft bezier curves to match the reference. This is harder to get right.
- **Approach C:** Use a high-quality γ glyph from a serif font (e.g., EB Garamond, Cormorant) and convert to SVG path.
- **File:** `src/components/brand/TransitivityLogo.tsx`
- **Details:** The SVG should be a single filled path with `fill={color}` instead of `stroke`. ViewBox should remain `0 0 64 64`.

### Task 2.2 — Update All Logo Usages
After the new γ is created, verify it looks correct in:
- Landing page hero (line 381)
- Landing page header (via TransitivityLogo)
- Sidebar (collapsed and expanded)
- Login/Register left panel
- FloatingChat header
- Footer

---

## 3. Landing Page Fixes

**File:** `src/app/[locale]/page.tsx`

### Task 3.1 — Center Nav Items
- **Problem:** "About", "Pricing", "Course" links are not visually centered in the header bar
- **Current:** `<nav className="hidden items-center gap-8 sm:flex">` is in a `justify-between` flex container
- **Fix:** Make the header a 3-column grid or use `absolute left-1/2 -translate-x-1/2` on the nav to center it regardless of logo/button widths

### Task 3.2 — Increase "Transitivity" Text Size in Header
- **Current:** `TransitivityLogo size="sm"` (24px icon, 0.875rem text)
- **Fix:** Change to `size="md"` (32px icon, 1.125rem text) or create a custom intermediate size

### Task 3.3 — Resize Trust Bar Logos
- **Current sizes:** Gaussian=40, MLatom=32, SciPy=36, UnB=44, UEG=40
- **Requested:** Decrease UnB, increase UEG
- **Proposed:** UnB=32, UEG=48. Also ensure all logos look balanced together.

### Task 3.4 — Remove Comma from Hero Title
- (See Task 1.3)

---

## 4. Login & Register Pages

**Files:** `src/app/[locale]/(auth)/login/page.tsx`, `src/app/[locale]/(auth)/register/page.tsx`

### Task 4.1 — Replace Γ Circle with Gamma Logo Image
- **Problem:** Both pages show `<span style={{ fontSize: '4rem' }}>Γ</span>` inside a circle — an uppercase Greek Gamma, not the calligraphic γ
- **Fix:** After Task 2.1, replace the circle+span with the new `GammaIcon` at a large size (e.g., `size={120}`) or use `/images/gamablue.png` as an `<img>` with `rounded-full` and appropriate sizing
- **Recommended:** Use the `GammaIcon` component at larger size with white color, remove the surrounding bordered circle div

### Task 4.2 — Remove "Plataforma SaaS de Química Computacional" Text
- **Current:** `<p className="text-lg ...">{tb('subtitle')}</p>` shows "Plataforma SaaS de Química Computacional"
- **Fix:** Remove this `<p>` tag, or replace with just the university name

### Task 4.3 — Fix demoNamePlaceholder
- (See Task 1.2)

---

## 5. Course Page Overhaul

**File:** `src/app/[locale]/course/page.tsx`

### Task 5.1 — Redesign with YouTube Placeholder Lives
- **Current:** Has ColabCard components linking to notebooks, partner logos, notebook-centric layout
- **New design:**
  - Vertical scroll through 4 modules (Module 1 → 2 → 3 → 4)
  - Each module section has:
    - YouTube embed (placeholder AI chemistry live, e.g., a relevant public lecture)
    - Module title and description
    - List of associated notebooks (ColabCard links)
    - Notes/description text visible inline
  - Full-width sections, alternating backgrounds (same pattern as landing page features)
  - As user scrolls, they progress naturally from Module 1 to Module 4

### Task 5.2 — Remove IEEE/UEG Logos
- Remove partner logo section from course page
- Keep it simple: videos, notebooks, notes

### Task 5.3 — Fix Course Page Topbar Transparency
- **Problem:** Same as landing page — topbar shows white at top instead of transparent
- **Fix:** Reuse the same header-bar CSS pattern from the landing page (transparent at top, white on scroll)
- The course page likely has its own header — apply the same `.header-bar` / `.header-scrolled` approach

### Task 5.4 — YouTube Placeholder Videos
- Use relevant public YouTube videos about AI in chemistry as placeholders:
  - Module 1 (ML Fundamentals): A general ML intro lecture
  - Module 2 (Deep Learning): A DL fundamentals lecture
  - Module 3 (GNNs/MPNNs): A GNN for molecules lecture
  - Module 4 (CNNs): A CNN lecture or chemistry CNN application
- Embed with standard `<iframe>` YouTube embed, responsive 16:9 aspect ratio
- Mark them as "(placeholder)" so it's clear they'll be replaced

### Task 5.5 — Update i18n Strings
- Update `course` namespace in both `en.json` and `pt-BR.json` to match new module-focused structure

---

## 6. AI Chat — API Key & Floating Chat

### Task 6.1 — Replace API Key
- (See Task 1.1)

### Task 6.2 — Hide Floating Chat on Assistant Page
- **File:** `src/components/chat/FloatingChat.tsx` or `src/app/[locale]/(dashboard)/DashboardShell.tsx`
- **Approach A:** In `FloatingChat`, use `usePathname()` and hide when path includes `/assistant`
- **Approach B:** In `DashboardShell`, conditionally render `<FloatingChat />` based on current route

### Task 6.3 — Shared Chat History Between FloatingChat and Assistant Page
- **Current state:** `FloatingChat` uses local `useState` for messages, `AssistantClient` likely has its own state
- **Options:**
  - **Option A (Recommended):** Remove "Assistente" from sidebar nav. The floating chat IS the assistant. Users access it from any page via the floating button.
  - **Option B:** Create a shared chat context (React Context) that both FloatingChat and AssistantPage consume. Store messages in the context, persist to localStorage or DB.
  - **Option C:** Keep assistant page but have it render the same FloatingChat component in full-page mode.
- **Decision needed from user:** Which option?

---

## 7. Dashboard Content Enrichment

**File:** `src/app/[locale]/(dashboard)/dashboard/page.tsx`

### Current State
- Shows welcome message + 5 quick-link cards (Rate Constant, Fitting, MD, ML, Assistant) with item counts
- Very sparse

### Task 7.1 — Recent Activity Feed
- Show last 5-10 calculations/jobs across all modules
- Each entry: type icon, name, date, status
- Uses existing Prisma models (Reaction, FittingJob, MDSimulation, MLJob)

### Task 7.2 — Summary Statistics Cards
- Total calculations, credits used this month, active jobs
- Small stat cards at the top with icons

### Task 7.3 — Quick Action Area
- Drag-and-drop file upload zone: "Drop a Gaussian .log file to start a rate constant calculation"
- Prominent "New Calculation" buttons for each module

### Task 7.4 — Placeholder Charts
- A small chart showing calculation history over time (last 7 days / 30 days)
- Could use recharts or a simple SVG chart
- Data from Prisma: count calculations grouped by createdAt date

### Task 7.5 — Mini Server Status Widget
- Small card showing "Server: Online" / "API: Online" with green/red dots
- Links to the full Server Status page (Task 8.1)

---

## 8. New Sidebar Pages

### Task 8.1 — Server Status Page

**New files:**
- `src/app/[locale]/(dashboard)/server-status/page.tsx`
- Add `server-status` to sidebar navItems in `Sidebar.tsx`

**Content (MVP/placeholder):**
- Server status indicator (API health check endpoint)
- FastAPI service status (ping `/api/v1/health`)
- Database connection status
- Placeholder sections for future: RabbitMQ queue metrics, job queue depth, worker status, compute node availability
- Simple table or card layout

**Sidebar:** Add `{ key: 'serverStatus', href: '/server-status', icon: Server }` (from lucide-react)

### Task 8.2 — Wiki Page

**New files:**
- `src/app/[locale]/(dashboard)/wiki/page.tsx`

**Content (MVP):**
- Documentation hub for Transitivity 2.0 features
- Sections for: TST theory, tunneling methods, fitting models, MD simulation types, ML potentials
- Static markdown-like content rendered as React components
- Links to external references (papers, docs)
- Searchable (basic client-side filter)

**Sidebar:** Add `{ key: 'wiki', href: '/wiki', icon: BookOpen }` (from lucide-react)

### Task 8.3 — Update i18n for New Pages
- Add `serverStatus` and `wiki` keys to `nav` namespace
- Add `serverStatus` and `wiki` content namespaces

---

## 9. Outdated Chemistry Icons Audit

### Task 9.1 — Audit Current Icons
Boss said: "Mudanca de icons no front (alguns icones de quimica estao ultrapassados)"

**Current icon usage:**
| Location | Icon | Library |
|---|---|---|
| Sidebar - MD | `Atom` | lucide-react |
| Sidebar - ML | `Brain` | lucide-react |
| Sidebar - Rate Constant | `Calculator` | lucide-react |
| Sidebar - Fitting | `TrendingUp` | lucide-react |
| Dashboard quick links | Same as sidebar | lucide-react |
| ML empty state | `FlaskConical` | lucide-react |
| MD empty state | `FlaskConical` | lucide-react |

**Assessment:**
- `Atom` for Molecular Dynamics is fine and modern
- `Brain` for ML is fine and modern
- `Calculator` for Rate Constant is generic but acceptable
- `TrendingUp` for Fitting is generic but acceptable
- `FlaskConical` is a standard chemistry icon and not outdated

**Possible improvements:**
- Replace `Calculator` with a more chemistry-specific icon (e.g., a reaction arrow icon, or a custom TST barrier icon)
- Replace `TrendingUp` with a curve-fitting specific icon
- Consider using custom SVG icons for chemistry-specific concepts rather than generic lucide icons
- Could create custom icons: reaction barrier diagram, Arrhenius curve, molecular dynamics trajectory

### Task 9.2 — Research and Create Custom Chemistry Icons
- Design 4-5 custom SVG icons that are more chemistry-specific
- Create `src/components/icons/chemistry.tsx` with custom React components
- Replace generic lucide icons in sidebar and dashboard

**Decision needed:** Does the boss want specific icon changes, or a general modernization? We should ask for examples of what they consider "outdated" vs "modern".

---

## 10. ASKCOS / Ketcher Molecule Drawing (Future Feature)

### Research Summary
- **ASKCOS** (Automated System for Knowledge-based Continuous Organic Synthesis) is MIT's open-source retrosynthesis planning tool
- ASKCOS uses **Ketcher** (by EPAM, open-source) as its molecule drawing/sketcher component
- **Ketcher** is a web-based molecular editor supporting:
  - 2D structure drawing (common chemical drawing standards)
  - 3D visualization
  - Template library for common structures
  - Stereochemistry, atom/bond properties
  - File formats: MOL, SDF, SMILES, InChI, SMARTS, RXN, CML, KET
  - Image recognition (OCR for structure images)
  - PNG/SVG export
  - React integration available via `ketcher-react` npm package

### Task 10.1 — Ketcher Integration Plan (Future Sprint)
- **Package:** `ketcher-react` + `ketcher-standalone` (no server needed for basic drawing)
- **Use cases in Transitivity:**
  1. Draw molecules for ML prediction input (instead of file upload only)
  2. Visualize reactants/products in rate constant calculations
  3. Draw transition states
  4. Export SMILES/MOL for backend processing
- **Integration points:**
  - New component: `src/components/chemistry/MoleculeDrawer.tsx`
  - Embed in ML predict wizard as alternative to file upload
  - Embed in rate constant wizard for molecule selection
- **Dependencies:** `ketcher-react`, `ketcher-standalone`
- **Effort:** Medium-large (2-3 days) — mostly UI integration and state management
- **NOT for this sprint** — create as a tracked to-do for future work

---

## 11. Comprehensive Test Suite

### Current State
- **Backend (FastAPI):** 54 pytest tests in `api/tests/` — all passing
- **Frontend (Next.js):** ZERO tests
- **QuestionPunk stack:** Jest + Cypress (E2E)

### Task 11.1 — Frontend Unit Tests (Vitest)
- **Setup:** Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- **Config:** Create `vitest.config.ts` with Next.js/React support
- **Priority test files:**

| Test File | Tests | Description |
|---|---|---|
| `__tests__/components/brand/TransitivityLogo.test.tsx` | 3 | Renders GammaIcon, TransitivityLogo, GammaIconRound |
| `__tests__/components/chat/FloatingChat.test.tsx` | 5 | Opens/closes, sends message, model selection, error handling |
| `__tests__/components/layout/Sidebar.test.tsx` | 4 | Renders nav items, collapse, credits display, active state |
| `__tests__/components/chemistry/MoleculeViewer.test.tsx` | 3 | Renders atoms, rotation, empty state |
| `__tests__/lib/usage.test.ts` | 4 | Credit calculation, operation costs |
| `__tests__/lib/validators/*.test.ts` | 5 | Zod schema validation (rate, fitting, md, ml) |

### Task 11.2 — API Route Tests (Vitest)
| Test File | Tests | Description |
|---|---|---|
| `__tests__/api/chat.test.ts` | 4 | POST validation, model validation, streaming, error handling |
| `__tests__/api/auth.test.ts` | 3 | Register, login, session |
| `__tests__/api/rate-constant.test.ts` | 3 | Create, calculate, list |
| `__tests__/api/fitting.test.ts` | 3 | Create, run, results |

### Task 11.3 — E2E Tests (Playwright or Cypress)
- **Recommended:** Playwright (more modern, better DX than Cypress)
- **Setup:** Install `@playwright/test`
- **Config:** `playwright.config.ts` with Next.js dev server

| Test File | Tests | Description |
|---|---|---|
| `e2e/auth.spec.ts` | 3 | Register, login, logout flow |
| `e2e/landing.spec.ts` | 3 | Hero renders, nav works, pricing visible |
| `e2e/dashboard.spec.ts` | 3 | Cards render, navigation works |
| `e2e/rate-constant.spec.ts` | 2 | File upload, calculation flow |
| `e2e/chat.spec.ts` | 2 | Open chat, send message |

### Task 11.4 — Backend Test Expansion
- Current: 54 tests
- Add integration tests for:
  - Rate constant edge cases (extreme temperatures, missing fields)
  - Fitting with real data files
  - MD input generation for all simulation types
  - ML client mock tests

### Task 11.5 — CI Pipeline
- Add test commands to `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:coverage": "vitest run --coverage"
  ```
- Add to Vercel build or GitHub Actions

---

## Priority & Execution Order

### Phase A — Immediate (Quick Fixes, 30 min)
- [ ] Task 1.1: Replace OpenRouter API key
- [ ] Task 1.2: Fix demoNamePlaceholder
- [ ] Task 1.3: Remove comma from hero title

### Phase B — Branding & Visual (2-3 hours)
- [ ] Task 2.1: Create proper calligraphic γ SVG
- [ ] Task 2.2: Update all logo usages
- [ ] Task 3.1: Center nav items
- [ ] Task 3.2: Increase header logo size
- [ ] Task 3.3: Resize trust bar logos
- [ ] Task 4.1: Replace Γ with new gamma on auth pages
- [ ] Task 4.2: Remove "Plataforma SaaS" text

### Phase C — Pages (3-4 hours)
- [ ] Task 5.1-5.5: Course page overhaul
- [ ] Task 6.2: Hide floating chat on assistant page
- [ ] Task 6.3: Decide & implement chat history strategy
- [ ] Task 7.1-7.5: Dashboard enrichment
- [ ] Task 8.1: Server Status page
- [ ] Task 8.2: Wiki page
- [ ] Task 8.3: i18n updates

### Phase D — Polish & Quality (2-3 hours)
- [ ] Task 9.1: Chemistry icons audit
- [ ] Task 9.2: Custom chemistry icons (if needed)

### Phase E — Testing (4-6 hours)
- [ ] Task 11.1: Frontend unit tests
- [ ] Task 11.2: API route tests
- [ ] Task 11.3: E2E tests
- [ ] Task 11.4: Backend test expansion
- [ ] Task 11.5: CI pipeline

### Phase F — Future (Tracked as TODO)
- [ ] Task 10.1: Ketcher molecule drawing integration

---

## Decisions Needed From User

1. **Task 2.1 (Gamma Logo):** Which approach? (A) Auto-trace gamablue.png, (B) Hand-craft SVG, (C) Font glyph extraction
2. **Task 6.3 (Chat History):** (A) Remove assistant sidebar item, (B) Shared context, (C) Full-page floating chat
3. **Task 9.2 (Chemistry Icons):** Need clarification from boss on which specific icons are "outdated"
4. **Task 11.3 (E2E):** Playwright (recommended) or Cypress (matches QuestionPunk)?

---

*This plan covers all items from the user's request. No implementation will begin until this plan is approved.*
