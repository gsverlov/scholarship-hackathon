# Design Guidelines: Scholarship Matching & Essay Generation Platform

## Design Approach
**System Selected:** Material Design 3 principles adapted for educational technology
**Rationale:** Information-dense application requiring clear forms, data comparison, and content readability. Focus on usability, trust, and efficient workflow completion.

---

## Core Design Elements

### A. Typography
**Font System (Google Fonts):**
- Primary: Inter (400, 500, 600) - UI elements, forms, body text
- Secondary: Merriweather (400, 700) - Generated essay display for readability

**Hierarchy:**
- H1: text-4xl font-semibold - Page titles ("Match Your Scholarships")
- H2: text-2xl font-semibold - Section headers ("Top 5 Matches")
- H3: text-xl font-medium - Card titles (scholarship names)
- Body: text-base - Form labels, descriptions
- Small: text-sm - Helper text, metadata
- Essay Display: text-lg leading-relaxed - Generated essay content

### B. Layout System
**Spacing Primitives:** Tailwind units of 4, 6, and 8 (p-4, p-6, p-8, gap-4, space-y-6)

**Container Strategy:**
- Max-width: max-w-4xl for forms and content
- Max-width: max-w-6xl for scholarship comparison grid
- Consistent padding: px-4 md:px-6 lg:px-8

**Workflow Steps Layout:**
- Progress indicator at top showing: Profile → Match → Select → Generate
- Each step occupies full container with clear section separation
- Vertical rhythm: py-8 between major sections

---

## Component Library

### 1. Student Profile Form (Step 1)
**Structure:**
- Two-column grid on desktop (grid-cols-1 md:grid-cols-2)
- Full-width for textarea fields
- Grouped sections with subtle dividers

**Form Fields:**
- Text inputs: GPA, Name, Field of Study
- Select dropdowns: Degree Level, Citizenship
- Textarea: Background story, Activities, Career goals, Challenges
- Labels: font-medium mb-2
- Inputs: rounded-lg border p-3 with focus states

**Submit Button:**
- Primary action: "Find My Scholarships"
- Full-width on mobile, fixed-width on desktop
- Positioned at form bottom with mt-8

### 2. Scholarship Results Display (Step 2)
**Card Grid:**
- grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Shows all 5 scholarships simultaneously for comparison

**Individual Scholarship Card:**
- Elevated container with border and subtle shadow
- **Header section:** Scholarship name (h3), match score badge
- **Content section:** Description preview (max 3 lines with truncation), URL link
- **Metadata row:** GPA requirement, degree level icons/badges
- **Action:** "Generate Essay" button (full-width within card)

**Match Score Badge:**
- Positioned top-right corner
- Circle or rounded pill showing percentage/score
- Visual indicator of match quality

### 3. Essay Generation Display (Step 3)
**Layout:**
- Single column, max-w-4xl
- Clear visual separation from previous steps

**Essay Container:**
- White/light background panel with generous padding (p-8)
- Essay text in Merriweather font for readability
- Line-height: leading-relaxed
- Paragraph spacing: space-y-4

**Metadata Panel (Above or Below Essay):**
- Compact info cards showing:
  - Selected scholarship name
  - Strategy cluster used
  - Match reasoning snippet
- grid-cols-1 md:grid-cols-3 gap-4

**Actions:**
- "Copy Essay" button
- "Download as Text" button
- "Generate Another Essay" link to return to scholarship selection

### 4. Navigation & Progress
**Header:**
- Fixed top bar with app title "ScholarshipAI" or similar
- Minimal navigation (no complex menu needed)
- Optional: User profile indicator if multi-user

**Progress Indicator:**
- Horizontal stepper showing 4 steps
- Active step highlighted, completed steps with checkmarks
- Positioned below header, sticky on scroll

### 5. Micro-Components
**Loading States:**
- Spinner with status text during:
  - Scholarship matching
  - Essay generation
- Message: "Finding your best matches..." / "Generating personalized essay..."

**Empty/Error States:**
- Friendly messages if no matches found
- Guidance on adjusting profile for better results

---

## Animations
**Minimal Usage:**
- Smooth transitions between workflow steps (fade in/out)
- Loading spinners only
- No decorative animations

---

## Images
**No hero images required** - This is a functional application, not a marketing page
**Icon usage:** Material Icons for form field prefixes, status indicators, and action buttons

---

## Critical Implementation Notes
- **Form validation:** Real-time feedback on required fields
- **Responsive:** Mobile-first, forms stack to single column, cards follow grid pattern
- **Accessibility:** Proper labels, focus management through workflow steps, ARIA labels on progress indicator
- **Viewport:** Natural content flow, no forced viewport heights - let content breathe
- **Trust signals:** Professional typography, clear data presentation, transparent match scoring builds credibility