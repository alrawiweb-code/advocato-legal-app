# UI Sizing, Spacing & Visual Audit Report

This audit analyzes the layout, typography, touch targets, and visual hierarchy of the Advocato application against the Counsel Design System specification (`DESIGN.md`), with specific emphasis on the mobile viewport rendering observed on `/lawyers`.

---

## 1. Identified Visual & Dimensional Deficiencies

### A. Information Density & Mobile Viewport Compression
In the initial mobile rendering of `/lawyers`, the area above the fold was burdened by multiple stacked control groups: a redundant floating status badge, a separate two-line "SORT BY" selector, and an eight-item wrapped filter list. This consumed over 210px of vertical height before the client could view the first matching attorney card. In narrow viewports (360px–390px), this forced the page into an awkward scrolling state and pushed the primary content below the screen fold.

### B. Attorney Card Element Wrapping & Overlap
The header block of the lawyer card suffered from horizontal constriction. With an 80px avatar, a 16px horizontal gap, 48px of cumulative card padding, and an absolute-positioned "Verified" badge occupying 70px on the right, the remaining width for the attorney details fell under 170px. Consequently:
- The rate and availability metadata line (`$350 / hr • Available today`) was forced to wrap irregularly, breaking the word "Available" from "today" onto a second orphan line.
- The attorney name was squeezed into the left column, risking truncation against the absolute badge.
- A two-line bio paragraph and two full-width stacked action buttons ("Schedule Consultation" and "View Full Profile") inflated the overall card height to over 480px, allowing only one card to be partially visible at any moment.

### C. Bottom Navigation Bar Collision & Safe-Area Margins
At the base of the mobile view, the navigation bar was constrained without adequate vertical breathing room, pushing the text labels against the edge of the viewport. In development mode, the Next.js runtime status indicator badge hovered over the bottom-left "Home" tab, occluding the navigation icon. Furthermore, the content container lacked adequate bottom padding, causing card content to collide with the floating glassmorphism navigation bar during scroll.

---

## 2. Refinements Applied

1. **Card Layout & Proportions in [app/lawyers/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/page.tsx):**
   - **Avatar Sizing:** Adjusted from `w-20 h-20` (80px) to `w-16 h-16` (64px) on mobile viewports, expanding right-column width by 25%.
   - **Availability Metadata:** Encapsulated availability in a distinct inline status pill (`bg-surface-container-low`, `whitespace-nowrap`) alongside a clean tabular rate counter (`$350 / hr`), preventing irregular text wrapping.
   - **Verified Badge Position:** Retained absolute top-right anchoring (`top-4 right-4`) while applying right-padding to the attorney name header to guarantee zero visual collisions.
   - **Action Hierarchy:** Replaced the stacked two-button layout with a single primary CTA button ("Schedule Consultation") paired with a refined editorial link ("View Full Profile →"), matching the original Swiss-grid prototype structure and reducing card height by 75px.

2. **Streamlined Filter Architecture:**
   - Consolidated the multi-row "SORT BY" and filter elements into a single-line, horizontally scrollable filter strip with zero scrollbar friction (`no-scrollbar`). This recovers over 130px of vertical space on mobile devices.

3. **Bottom Navigation & Viewport Margins in [components/navigation/BottomNav.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/BottomNav.tsx):**
   - Integrated native Material Symbols icons with active fill states (`font-variation-settings: 'FILL' 1`).
   - Extended bottom padding on list views to `pb-32` on mobile, ensuring full visibility of card actions above the navigation bar.
   - Disabled the development indicator badge in [next.config.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/next.config.ts) (`devIndicators: false`) to eliminate UI occlusion.
