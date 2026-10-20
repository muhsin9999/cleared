# Design system

**Goal:** a judge's first reaction is "this is a real product." The look should be calm and trustworthy like Mercury or Stripe, with three moments of genuine wow, and only where the AI is doing the work.

## Library stack (all free for a public repo)

| Role | Choice | Licence | Why |
| --- | --- | --- | --- |
| Components | **shadcn/ui** (CLI v4, Base UI primitives, Tailwind v4) | MIT | Copied into the repo, so it's fully re-themeable. Includes Field, Item, Empty, Chart (Recharts v3, `accessibilityLayer`) and **Human in the Loop** (Aug 2026), which fits the approval step. |
| Motion engine | **Motion** (`m` + `LazyMotion` + `domAnimation`) | MIT | Layout animations and AnimatePresence power the packet-assembly moment. Lazy loading keeps the bundle small. |
| Animated components | **Magic UI** + **Cult UI** (via the shadcn registry) | MIT | Both run on Motion, so there's only one engine. Magic UI: Animated Beam, Border Beam, Animated List, Number Ticker, Bento Grid, File Tree, Blur Fade. Cult UI: Texture Card, Halo Dropzone, Dynamic Island, Security Checkpoint. |
| Numbers | **NumberFlow** | MIT | Animated currency, score and day counters. Motion's AnimateNumber is paid (Motion+). |
| Toasts | **Sonner** | MIT | Webhook arrival toasts |
| Fonts | **Geist + Geist Mono** (OFL); optional **Instrument Serif** for one editorial headline | OFL | Free to commit to a public repo |

**Avoid:**
- Aceternity: its licence forbids redistributing source in a public repo.
- Origin UI / coss: AGPL.
- React Bits backgrounds: the "AI landing page" cliché.
- GSAP: redundant next to Motion.
- Three.js: off-brand for a money product.
- Satoshi / General Sans: Fontshare's EULA bars committing the font files.
- React Bits and animate-ui are MIT + Commons Clause. They're usable, but describe them as "source-available."

## Brand: "Ledger" (chosen)

- **Name styling:** lowercase **cleared.** in Geist Bold with tight tracking (−0.035em); the full stop is `--cleared` green (on ink, `--cleared-tint`). The landing nav uses the lockup at `size="xl"` (38px "seal" stamp without ring text + 1.7rem wordmark; hover/focus turns the stamp a few degrees and deepens the ink); the sidebar and footer use the default lockup. `Logo` takes `size` (sm/md/lg/xl), `mark` and `markClassName`; `StampMark` takes `detail` (auto/simple/full/seal).
- **Landing surfaces:** the page stays on paper. Sections alternate `--paper` (#F7F6F2) and `--paper-deep` (#F1EFE9) with a `--line` hairline between them, like ledger pages; cards are `--surface` white. Dark ink (#0B1215) is used for one band only, the closing call to action. Landing motion plays on its own once, when in view (hero check 500ms after it is on screen, numbers when half the band is visible, the three moments staggered 350ms); nothing replays on hover.
- **Mark:** a circular stamp: outer ring, thin inner ring, "CLEARED" on a circular path and a bold check. Under 40px (`StampMark` decides with a container query) the text drops and a heavy ring + check remain, as in the favicon (`src/app/icon.svg`, `apple-icon.png`). The same stamp seals the evidence packet, so the brand *is* the product moment.
- **Theme:** **light** by default. Documents (invoice, packet) read as real paper and stay legible after video compression. Dark mode is supported via tokens but isn't the demo theme.

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | #F7F6F2 | App background (warm, documentary) |
| `--surface` | #FFFFFF | Cards, documents |
| `--ink` | #0B1215 | Text |
| `--muted` | #5B6470 | Secondary text |
| `--line` | #E4E2DC | Borders |
| `--cleared` | #0F7B5F | Primary: safe, done, approve |
| `--cleared-tint` | #E3F2EC | Success backgrounds |
| `--caution` | #B45309 | Warnings, pending holds |
| `--risk` | #B42318 | Risk findings, phishing |
| `--focus` | #2F6FED | Focus ring only |

- **Shape:** radius 10px for cards, 6px for inputs.
- **Shadows:** one soft shadow (`0 1px 2px rgb(11 18 21 / .06), 0 8px 24px rgb(11 18 21 / .06)`).
- **Spacing:** 4px base.
- **No PayPal blue or gold in Cleared's UI.** PayPal elements stay visually PayPal's. The footer reads "Not affiliated with or endorsed by PayPal."
- **Motion personality: "notarial."** 150–250ms ease-out, no bounce. Things settle and stamp into place. Glow and beams appear **only while the AI is working**, and settled states are still. Nothing moves on money or approval buttons.

## The three wow moments

1. **The pre-flight scan (F1):**
   - The sale card gets a Border Beam while scanning.
   - Checks stream in through an Animated List ("First sale over 3× your average", "Delivery date missing", "Refund terms unclear").
   - A circular readiness ring and NumberFlow score climb from 38 to 94 as Ada accepts each one-click fix.
2. **The packet assembles itself (F6):**
   - Exhibit cards (files, acceptance receipt, invoice, tracking) fly from the locker with Motion `layout` into a stacked Texture Card document.
   - Exhibit numbers stamp in, each claim's citation chip lights up, and finally the **cleared stamp seals the packet**.
   - Then comes the Human-in-the-Loop "Approve & submit to PayPal" step.
3. **Live PayPal timeline (F5):**
   - Verified webhooks arrive as a vertical timeline with Geist Mono event names (`CUSTOMER.DISPUTE.RESOLVED`) and a plain-English line ("Dispute closed in your favour").
   - A Dynamic Island at the top shows "$400 releases in 6 days."

Supporting pieces:
- **Landing:** Animated Beam (Ada → cleared → PayPal) and a single Blur Fade headline.
- **Home:** a Bento Grid with funds in flight, days to release, proof coverage and open cases.

## Accessibility (non-negotiable; Design is 20% of the score)

- `<MotionConfig reducedMotion="user">` wraps the app. Use `useReducedMotion()` to swap flying cards for crossfades. CSS effects go behind `motion-safe:`.
- The scan verdict is announced through `aria-live="polite"`.
- Risk is never shown by colour alone: always an icon plus text.
- WCAG AA contrast (check `--muted` on `--paper`).
- Focus rings everywhere, full keyboard path through the approval flow.
- Nothing flashes more than 3 times per second.

## Video legibility

- Record at 1440×900 with 125% zoom and body text ≥16px.
- Slow transitions slightly in recording mode (`?demo=1` multiplies durations by 1.3).
- No dead air: the scan and packet must finish within the narration line.

## Process

1. Day 2: set the tokens in `globals.css` and add the shadcn theme. Build a `/styleguide` page that renders every component in the brand, so nothing ships in shadcn defaults.
2. Build each screen from the styleguide only.
3. A design pass on day 11 for spacing, empty states and motion timing (use the `impeccable` / `frontend-design` skills for a critique pass).
