---
name: Counsel
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#45464d'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#525e7d'
  primary: '#000a24'
  on-primary: '#ffffff'
  primary-container: '#14213d'
  on-primary-container: '#7c89aa'
  inverse-primary: '#b9c6ea'
  secondary: '#43617c'
  on-secondary: '#ffffff'
  secondary-container: '#c1e0ff'
  on-secondary-container: '#46647e'
  tertiary: '#130a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#301f00'
  on-tertiary-container: '#ad8233'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b9c6ea'
  on-primary-fixed: '#0d1b36'
  on-primary-fixed-variant: '#3a4664'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#abcae8'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#2b4963'
  tertiary-fixed: '#ffdeab'
  tertiary-fixed-dim: '#f0bf6a'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  headline-xl:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max-width: 1280px
---

## Brand & Style

The design system is built on the principles of **Editorial Minimalism** and **Swiss-grid structure**. It aims to evoke an emotional response of absolute trust, quiet authority, and intellectual clarity, specifically tailored for high-end legal, advisory, or executive consulting platforms.

The aesthetic prioritizes information hierarchy through generous whitespace and a rigorous alignment to a mathematical grid. It rejects superfluous ornamentation in favor of precise "hairline" strokes and a restrained use of its accent color. The visual language balances the traditional heritage of legal counsel (serif typography, muted brass) with a modern, high-performance interface (systematic sans-serifs, high-contrast clarity).

## Colors

This color palette is architectural and purposeful. The primary **Deep Navy** provides the structural weight, while the **Warm Off-white** background prevents the interface from feeling sterile or overly corporate.

**Accent Discipline:**
- **Muted Brass (#C99B4A)** is reserved strictly for primary Calls to Action (CTAs) and "Verified" or "Official" status indicators. It must never be used for decorative elements or secondary buttons.
- **Slate Blue (#3E5C76)** serves as the functional color for secondary actions, links, and selected states.
- In **Dark Mode**, the accent shifts to a slightly brighter **#D9AE6A** to maintain accessibility and visual "glow" against the deep background.

## Typography

The typography strategy employs a high-contrast pairing to distinguish between narrative content and functional data. 

- **Fraunces** (Serif) is used for editorial headings and pull-quotes. Its weights are kept between 500 and 600 to ensure it feels established without appearing overly aggressive.
- **Inter** (Sans-serif) handles all interface elements, body text, and metadata. It provides a technical, legible counterpoint to the more expressive serif.
- Large headlines use negative letter-spacing to mimic high-end print typesetting. 
- Small labels utilize increased letter-spacing and uppercase styling to maintain legibility in dense legal or financial contexts.

## Layout & Spacing

This design system utilizes a **Fixed Grid** philosophy inspired by Swiss modernism. 

- **Desktop (1440px+):** A 12-column grid with 24px gutters and 64px outer margins. Content is strictly aligned to the left edge of columns to create strong vertical axes.
- **Tablet (768px - 1024px):** An 8-column grid with 24px gutters and 40px margins.
- **Mobile (Under 768px):** A 4-column grid with 16px gutters and 20px margins.

Vertical rhythm is maintained through a 4px baseline unit. All padding and margin values must be multiples of 8px (e.g., 16, 24, 32, 48) to ensure consistent density across all views.

## Elevation & Depth

In keeping with the editorial aesthetic, depth is achieved through **Low-contrast outlines** and **Tonal layers** rather than heavy shadows.

- **Hairline Borders:** Use a 1px solid stroke in `#E5E2DA` (Light Mode) or `#2D3A4F` (Dark Mode) to define surfaces.
- **Subtle Shadows:** Only used for floating elements (like dropdowns or modals). Shadows are highly diffused: `0px 12px 32px rgba(20, 33, 61, 0.08)`.
- **Surface Tiers:** Backgrounds use `#FAF9F6`. Elevated cards or containers use `#FFFFFF`. This subtle 1-step shift creates hierarchy without breaking the flat, printed feel of the UI.

## Shapes

The shape language is refined and professional, avoiding the playfulness of fully rounded "bubble" aesthetics while remaining more approachable than sharp 90-degree corners.

- **Standard Elements:** (Buttons, Input Fields, Cards) use a **10px** corner radius.
- **Large Containers:** (Modals, Section Blocks) use a **16px** corner radius.
- **Small Elements:** (Chips, Badges) use a **4px** radius to maintain a crisp, structured appearance.

## Components

### Buttons
- **Primary:** Background `#C99B4A`, Text `#FFFFFF`, 10px radius. Used only for the main action.
- **Secondary:** Background transparent, Border 1px `#14213D`, Text `#14213D`.
- **Ghost:** Text `#3E5C76`, no background or border.

### Input Fields
- Inputs feature a 1px hairline border. On focus, the border thickens to 1.5px and changes to `#3E5C76`. Labels are always `label-md` and placed above the field.

### Cards
- Cards use a `#FFFFFF` surface with a 1px `#E5E2DA` border. A very soft, low-opacity shadow is applied only on hover to indicate interactivity.

### Chips & Badges
- **Verified Badge:** Small brass circle icon with a white checkmark, paired with `label-sm` text in brass.
- **Filter Chips:** 4px radius, light grey background `#F2F0EA`, text `#14213D`.

### Lists
- Editorial-style list items separated by horizontal hairline strokes. Ensure 16px of vertical padding between items to maintain the open, airy feel of the Swiss grid.