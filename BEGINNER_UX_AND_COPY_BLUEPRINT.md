# Beginner-First UX, Copy, and Layout Blueprint

## 1. Core Principle: The "Stressed Layman" Standard

When people need legal help, they are almost always experiencing anxiety: they were fired, cheated out of pay, handed an intimidating non-disclosure agreement, or threatened with a lawsuit. In this state, complex jargon, cryptographic hashes, multiple competing buttons, and dense walls of text trigger cognitive overload.

A production-grade app for beginners must follow three rules:
1. **Never ask the user a question they need a lawyer to answer.** (Do not ask them to classify their case under formal legal doctrines like "Employment & Labor Jurisprudence" vs. "Commercial Tort").
2. **One primary action per screen.** Every view must have exactly one visually dominant next step.
3. **Familiarity over novelty.** Chat should feel like iMessage or WhatsApp; forms should feel like Typeform or Apple Settings; calls should feel like FaceTime.

---

## 2. Copy Transformation Matrix: From Jargon to Human English

| Current / Technical Copy | Beginner-Friendly Replacement | Why It Works |
| :--- | :--- | :--- |
| **Intelligence-Driven Legal Counsel** | **Find the right lawyer for your problem** | Explains the utility immediately in 8 words. |
| **Privileged Evidentiary Review** | **Private document review** | Removes intimidation; retains reassurance. |
| **State Bar Jurisdiction** | **What state are you in?** | Laymen understand location, not jurisdictional authority. |
| **Employment & Labor Law Specialist** | **Workplace & Job Lawyer** | Laymen search for "job problem", not "labor law". |
| **Corporate & Commercial Litigation** | **Business & Contract Lawyer** | Clear and conversational. |
| **Active Matter: ADV-2026-8341** | **Case: Job Termination Review** | People remember issues, not case docket IDs. |
| **SHA-256 Verified Authentic Document** | **✓ Verified & Encrypted File** | Users don't know cryptographic hashes; they want to know it is safe. |
| **Heuristic AI Assessment** | **Our Review of Your Situation** | "Heuristic" sounds like robotic academic jargon. |
| **Restrictive Covenants & NDA Enforceability** | **Non-compete and confidentiality rules** | Plain English description of the actual problem. |
| **Initiate Privileged WebRTC Session** | **Start Video Call** | Familiar, zero confusion. |
| **Matter Intake** | **Get Legal Help** | Direct, action-oriented. |

---

## 3. Navigation & Header Streamlining

### The Problem
The current header and navigation bar have too many overlapping concepts:
- Header has: `Overview`, `Get Help`, `Find a Lawyer`, `Messages (2)`, `For Lawyers`, `Client View / Lawyer View`, `Search`, and `Get Started`.
- A user sees "Get Help", "Find a Lawyer", and "Get Started" simultaneously. Which do they click? They don't know the difference.

### The Fix
1. **Client Header (Desktop)**:
   - Left: **Advocato** (Logo)
   - Center: **Find a Lawyer** &bull; **How It Works** &bull; **Messages**
   - Right: **Get Help** (Single high-contrast button) &bull; Mode Switcher pill (`Testing: Switch to Lawyer`)
2. **Bottom Navigation (Mobile)**:
   - Exactly 4 clean tabs with clear, single-word labels:
     - **Home** (House icon)
     - **Get Help** (Chat / Pen icon — primary action)
     - **Lawyers** (Users icon)
     - **Messages** (Chat bubble — dynamic unread badge only when unread > 0)
3. **Role Switcher Banner**:
   - Relocate the role switcher from a bulky banner across every screen into:
     - A discreet, elegant badge in the header on desktop.
     - Inside the **Profile / Settings** screen on mobile, plus a subtle toggle in the top header.
     - This stops ordinary users from wondering why they are named "Alex Mercer" or whether they are accidentally in the wrong account.

---

## 4. Screen-by-Screen Simplification

### A. Home Page (`/`)
- **Current Issue**: The home page mixes value propositions, 3-step explainers, featured lawyers, and attorney recruiting links in a single vertical scroll.
- **Beginner-Friendly Redesign**:
  1. **Hero**:
     - Headline: *"Have a legal issue at work or with a contract?"*
     - Subtitle: *"Explain what happened in plain English. We match you with verified lawyers licensed in your state who can help today."*
     - Single Primary Button: **[ Start Free Case Review &rarr; ]** (large, high-contrast, impossible to miss).
     - Secondary subtle link: *"Or browse available lawyers"*.
  2. **Three Reassuring Cards (Keep It Short)**:
     - **100% Confidential**: Your information is protected and never shared publicly.
     - **Clear Upfront Prices**: See hourly rates before you speak to any lawyer.
     - **Licensed Attorneys**: Every lawyer is verified with their state bar.
  3. **Attorney Callout**:
     - A small, clean footer card: *"Are you an attorney? Join our verified network &rarr;"*

### B. Intake Flow (`/intake` — "Tell Us What Happened")
- **Current Issue**: Asks for practice area categories, jurisdictions, urgency ratings, case titles, and attachments all on one busy screen.
- **Beginner-Friendly Redesign (2 Simple Steps)**:
  - **Step 1: What happened?**
    - Headline: *"Tell us what happened in your own words"*
    - Subtitle: *"Don't worry about legal terms. Just describe what occurred and what outcome you want."*
    - Quick-select pills (optional shortcuts):
      - 👔 *Fired or laid off*
      - 💰 *Unpaid wages or bonus*
      - 📑 *Offered a severance agreement*
      - 🤝 *Contract or partner dispute*
      - ❓ *Something else*
    - Text area: *"Write your story here..."* (with friendly mic button for speech).
  - **Step 2: Key Details (Fast & Frictionless)**:
    - *"What state did this happen in?"* (Single dropdown: e.g. New York, California, Texas).
    - *"Do you have any documents to share?"* (Optional upload: *"Attach agreement, letter, or email"*).
    - Large Button: **[ Find Matching Lawyers &rarr; ]**

### C. Lawyer Matches (`/lawyers`)
- **Current Issue**: Displays complex match percentages, multiple tag chips, filters, and conflicting action buttons ("Book Consultation" vs "View Profile").
- **Beginner-Friendly Redesign**:
  1. **Top Recommendation Hero**:
     - Clearly highlight the #1 best match with a gold badge: *"Best Match for Your Situation"*.
     - Explain why in 1 sentence: *"Elena specializes in severance negotiations and employment disputes in New York."*
     - Big button: **[ Message Lawyer ]** or **[ Book 30-Min Call ]**.
  2. **Other Available Lawyers**:
     - Show 2-3 clean profile cards below.
     - Display only 3 key numbers: Rate ($/hr), Years Experience, and State License.
     - One button: **[ View Profile &rarr; ]**.

### D. Messages & Call Room (`/messages`)
- **Current Issue**: Displays technical docket numbers (`ADV-2026-8341`), SHA-256 verification modal popups, and multiple action icons.
- **Beginner-Friendly Redesign**:
  1. **Chat Header**:
     - Lawyer photo + Name + *"Licensed in New York &bull; $350/hr"*
     - Two prominent buttons: **[ 📞 Phone Call ]** and **[ 📹 Video Call ]**.
  2. **Chat Thread**:
     - Clean, generous whitespace.
     - Status banner at top: *"🔒 This conversation is private and protected by attorney-client privilege."*
     - Attachments render cleanly with file name and size; clicking downloads or previews without cryptographic jargon.
  3. **Video Room**:
     - Big green/red intuitive controls (Mic, Camera, End Call).
     - Clear participant status: *"Connected with Counsel"* or *"Waiting for client to join..."*.

### E. Lawyer Practice Dashboard (`/` in Lawyer Mode)
- **Current Issue**: Prior to our audit, this showed the client homepage. Now it shows an attorney dashboard.
- **Next Level of Refinement**:
  - Keep it hyper-focused on 3 questions an attorney has when opening the app:
    1. *Do I have new client inquiries?* (Shows new intake submissions matching their practice area).
    2. *Do I have unread messages?* (One-click jump into active conversation).
    3. *Is my profile active and accepting clients?* (Toggle to set availability).

---

## 5. Visual De-cluttering & Sensory Overload Checklist

1. **Reduce Competing Badges**:
   - Remove decorative tags like "New Member", "General Advisory", "State Bar Licensed", "Matter Assessment" stacked on top of each other.
   - Limit badges to at most **one** per card (e.g. `✓ Verified License`).
2. **Increase Tap Targets & Whitespace**:
   - Ensure all interactive elements on mobile have minimum 44px height.
   - Give text breathing room with generous line-height (`leading-relaxed`).
3. **Muted Color Hierarchy**:
   - Keep backgrounds clean (`#FAF9F6` warm white / parchment).
   - Use deep navy (`#0B132B`) for headings.
   - Use warm brass (`#C5A059`) sparingly for primary actions and active states.
   - Eliminate unnecessary background tints, gradients, and multiple borders.

---

## 6. Actionable Implementation Order

1. **Overhaul `/intake` Copy & Flow**: Remove the legal category dropdown; let the AI classify the issue behind the scenes. Add 4 beginner topic pills and a state picker.
2. **Streamline `/lawyers` Matches**: Emphasize the top recommended attorney card with clear "Why this lawyer" plain English summary; remove redundant tag chips.
3. **Polish `/messages` & Video Call**: Clean up header info, replace cryptographic hashes with simple "Verified Confidential File", and ensure one-tap video calling.
4. **Refine Header Navigation**: Remove duplicate "Get Started" vs "Get Help" buttons; present a single clear call-to-action.
