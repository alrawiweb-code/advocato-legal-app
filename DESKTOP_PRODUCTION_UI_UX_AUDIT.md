# Desktop Production UI/UX Audit & Standardization Blueprint

This audit evaluates the desktop experience across every screen in Advocato, identifying alignment, proportion, layout, and visual hierarchy defects when viewed on desktop monitors (>=1024px), along with the exact changes required to bring each screen to a production-grade standard.

---

## 1. Executive Summary & Cross-Cutting Desktop Issues

| Issue Category | Current Desktop Defect | Production-Grade Standard |
| :--- | :--- | :--- |
| **Gutter Wasted Space** | Intake and Profile pages use narrow centered mobile columns (`max-w-[760px]`, `max-w-[800px]`) that leave ~60% of desktop screens empty. | Implement balanced 12-column desktop layouts with sticky reassurance/summary companion sidebars. |
| **Double Scrollbar on Chat** | `app/messages/page.tsx` uses `md:h-[calc(100dvh-5.5rem)]` inside a layout `<main>` with `pt-16 pb-10`, creating an outer page scrollbar and inner chat scrollbar. | Lock desktop messaging view to `h-[calc(100dvh-4rem)]` with zero outer overflow, filling the viewport seamlessly like Slack or Apple Messages. |
| **Overstretched Hero Images** | `app/lawyers/[id]/page.tsx` stretches a photo to `w-full h-[420px]` across 1000px, causing distortion and awkward negative margin overlap (`-mt-16`). | Replace with an editorial portrait split-header and a 2-column layout (bio/credentials on left, sticky booking card on right). |
| **Mobile-Like Swipe Strips** | `app/lawyers/page.tsx` renders filter pills inside `overflow-x-auto no-scrollbar -mx-4` which looks like a touch carousel on desktop. | Unified desktop filter toolbar integrating search, state dropdown, practice tags, and sort controls. |
| **Inconsistent Card Heights** | Featured lawyers and directory cards fluctuate in vertical height when descriptions or tags vary. | Standardize card structure with flex column alignment, fixed badge limits (max 2), and bottom-pinned action bars. |

---

## 2. Screen-by-Screen Desktop Audit & Prescriptions

### Screen 1: Global Header & Navigation ([components/navigation/Header.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/Header.tsx))
- **Current Defect**:
  - Role switcher pill is crammed next to the search button.
  - Active navigation indicator is a simple border-b that sits awkwardly against the header bottom border.
  - Search modal on desktop has basic inputs without quick keyboard shortcuts or category groupings.
- **Desktop Production Polish**:
  - Set container to `max-w-[1360px] px-8`.
  - Refine navigation links with subtle background pill highlights on hover and crisp active states.
  - Style the role switcher with clear visual distinction (`Client Perspective` vs `Attorney Perspective`).
  - Align the primary CTA **[ Get Legal Help ]** with `h-10 px-5` and subtle shadow.

---

### Screen 2: Homepage & Lawyer Dashboard ([app/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/page.tsx))
- **Current Defect**:
  - Client Hero: `max-w-3xl text-center` with `max-w-lg` buttons creates an isolated island in the middle of a large screen.
  - "How It Works" Section: Left column (7 cols) has 3 steps, but right column (5 cols) has 3 stacked cards that look sparse and vertically uneven.
  - Lawyer Dashboard View: The client inquiries list is a simple list of cards with tight padding instead of an authoritative practice dashboard.
- **Desktop Production Polish**:
  - **Client Hero**: Add an editorial 2-column split or an elevated typographic masthead with a live trust ribbon (*"Verified Bar Attorneys in NY, CA, TX &bull; 100% Confidential &bull; Free Case Review"*).
  - **How It Works**: Balance the 12-column grid (`lg:grid-cols-12`) so step cards and trust cards align with uniform heights and matching baseline padding.
  - **Featured Lawyers**: 3-column grid (`lg:grid-cols-3 gap-6`) with uniform 56px circular portraits, fixed 2-line title clamps, transparent rates, and bottom-aligned action links.
  - **Lawyer Dashboard**: Convert client inquiries into a clean, spacious data table/grid with columns for Client Name, Case Topic, State & Date, Unread Messages, and Quick Action buttons (Chat, Video Call).

---

### Screen 3: Guided Intake Flow ([app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx))
- **Current Defect**:
  - Single narrow column (`max-w-[760px]`) centered on desktop, leaving massive blank gutters.
  - Topic pills wrap unpredictably on wider screens.
- **Desktop Production Polish**:
  - Implement a modern **12-column split layout** (`max-w-[1200px]`):
    - **Left Area (8 cols)**:
      - Step 1: Problem description with 5 structured shortcut pills in a clean grid, generous textarea with speech-to-text button.
      - Step 2: State selector and document upload dropzone with drag-and-drop feedback and live attachment chips.
      - Dominant action button **[ Find Lawyers Who Can Help &rarr; ]**.
    - **Right Area (4 cols)**:
      - **Sticky Reassurance & Progress Sidebar**:
        - Reassurances: *100% Confidential &bull; Attorney-Client Privilege Protected &bull; Verified Bar Licenses &bull; Free Case Review Guarantee*.
        - Real-time intake checklist showing what the client has completed and what happens next.

---

### Screen 4: Lawyer Matching & Directory ([app/lawyers/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/page.tsx))
- **Current Defect**:
  - Filter chips use mobile horizontal scroll (`overflow-x-auto`).
  - Case assessment summary banner is basic text without structured metadata chips.
- **Desktop Production Polish**:
  - **Unified Desktop Filter Bar**:
    - Filter pills (All, Available Today, Job & Severance, Business & Contracts) alongside state selector dropdown and sort dropdown in a single, well-aligned horizontal bar.
  - **Docket Summary Banner**:
    - Structured case brief with case title, practice area badge, state badge, and attached file chips with download links.
  - **Lawyer Grid**:
    - 3-column layout (`lg:grid-cols-3 gap-6`) with full vertical stretch, top match highlighted with gold ribbon, max 2 tags per card, and standardized primary/secondary action buttons.

---

### Screen 5: Lawyer Profile Detail ([app/lawyers/[id]/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/%5Bid%5D/page.tsx))
- **Current Defect**:
  - Giant 420px image banner stretched across 1000px with `-mt-16` overlap card looks disproportionate.
- **Desktop Production Polish**:
  - **Editorial Split Profile Header**:
    - High-resolution circular/rounded portrait (120x120), lawyer name, verified license badge, jurisdiction, and practice areas cleanly organized without stretched banners.
  - **12-Column Desktop Grid**:
    - **Left Column (8 cols)**: Biography, Practice Areas, Notable Case Matters, State Bar Admissions & Education, and Verified Client Reviews.
    - **Right Column (4 cols)**: **Sticky Booking Box** (`sticky top-24`): Shows hourly rate, 30-minute private consultation details, time slot selection, and direct booking CTA.

---

### Screen 6: Messaging & WebRTC Video ([app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx))
- **Current Defect**:
  - Double vertical scrollbar on desktop caused by height miscalculation.
  - Sidebar width and main chat area proportions need refinement on wide displays.
- **Desktop Production Polish**:
  - Fix desktop outer container: `h-[calc(100dvh-4rem)]` with `overflow-hidden` and zero outer scrollbars.
  - Sidebar: Fixed 380px width with search input, filter tabs, and clean conversation cards showing case topic badges.
  - Main Chat:
    - Top header with lawyer portrait, verified badge, rate, prominent **[ 📹 Video Call ]** CTA, and phone button.
    - Sub-header showing case topic and confidentiality status.
    - Message stream: generous bubble padding, max-width 65%, verified confidential file badges, and docked message input with paperclip, voice recorder, and send button.

---

### Screen 7: Cases & Profile Views ([app/cases/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/cases/page.tsx), [app/profile/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/profile/page.tsx))
- **Cases Page Desktop Polish**:
  - Container: `max-w-[1200px]`.
  - Matter cards with distinct columns: Case Topic, Assigned Lawyer/Client, Status pill, Message count, and Open Chat button.
- **Profile Page Desktop Polish**:
  - Container: `max-w-[1140px]`.
  - 12-Column layout:
    - Left column (4 cols): User Identity Card with initials avatar, verified badge, and testing role switcher.
    - Right column (8 cols): Notifications, Cloud Storage status, Security settings, and Quick Links.
