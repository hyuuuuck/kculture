---
name: K-Spot Now
description: An independent cultural programme publication for English-speaking visitors to Korea.
colors:
  violet: "#251d48"
  amber: "#f4c95d"
  lavender: "#f3f0f9"
  ink: "#251d48"
  muted: "#665e79"
  line: "#d6d0e2"
  paper: "#fff"
  on-violet: "#ded5eb"
  success: "#286048"
  warning: "#795200"
  focus: "#8b5bb3"
typography:
  display:
    fontFamily: '"Programme", "Arial Narrow", sans-serif'
    fontSize: "clamp(44px, 5.5vw, 80px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Programme", "Arial Narrow", sans-serif'
    fontSize: "clamp(30px, 3.3vw, 46px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Programme", "Arial Narrow", sans-serif'
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  reading:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 700
rounded:
  control: "4px"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "56": "56px"
  gutter: "clamp(24px, 3.35vw, 56px)"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.violet}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.lavender}"
  save-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  save-button-selected:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.paper}"
  search-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    width: "100%"
  navigation-link:
    textColor: "{colors.ink}"
    padding: "8px 0"
  filter-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  filter-chip-selected:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.paper}"
  planner-card:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.ink}"
    padding: "26px"
  source-disclosure:
    padding: "18px 0"
  calendar-row:
    textColor: "{colors.ink}"
    padding: "24px 0"
  calendar-row-hover:
    backgroundColor: "{colors.lavender}"
---

# Design System: K-Spot Now

## Overview

**Creative North Star: "Independent cultural programme publication"**

K-Spot Now pairs the presence of a printed cultural programme with the legibility of an English-language reading site. Condensed, heavy headings establish the publication; quiet sans-serif prose explains the experience. Deep violet editorial fields, amber actions and credited cultural imagery give the work character without turning practical information into decoration.

The system supports reading and then planning. Flat white article surfaces carry the explanation; lavender regions collect supporting facts, filters and saved places. Publication imagery remains a real sourced photograph, poster or explicitly labelled illustration. It must not imply a field visit or current conditions that the evidence does not establish.

Recorded from the completed local implementation in `styles.css`, `scripts/build.mjs`, `app.js` and `scripts/lib/visitor-render.mjs`, with the built home and final review screenshots as visual evidence. This describes the local design, not production deployment, editorial approval or AdSense eligibility. Surface-specific cover composition stays in `.impeccable/surfaces/scripts-build-mjs.md`.

**Key Characteristics:**

- Condensed editorial headings and readable, uncondensed prose.
- Violet identity, amber actions, white reading surfaces and lavender support regions.
- Flat image-and-text composition with fine rules instead of floating card shells.
- Visible source context, truthful image credits and semantic planning controls.

## Colors

The palette is a violet-and-amber publication identity on bright reading paper; restrained status colors carry operational meaning.

The sidecar's eight-step tonal ramps are synthesized previews, not additional production colors. The frontmatter records the actual palette.

### Primary

- **Programme Violet** (`violet`): cover fields, guide bands, selected controls and identity.
- **Reading Ink** (`ink`): the same pigment in a text role. Keep the semantic distinction when using the native CSS properties.

### Secondary

- **Action Amber** (`amber`): primary actions, navigation indicators and selected directional accents on violet. It is not a general paragraph color.

### Neutral

- **Reading Paper** (`paper`): the page, article and unselected control background.
- **Lavender Paper** (`lavender`): supporting fact regions, filter tools, saved cards and footer.
- **Quiet Violet** (`muted`): supporting prose, metadata and explanatory labels on light surfaces.
- **Rule Lavender** (`line`): dividers and control borders.
- **Reverse Reading** (`on-violet`): supporting text inside dark editorial sections.

Success and warning are semantic live/upcoming colors, not extra brand accents. Focus is an interaction signal shared by links, buttons, fields and native disclosures.

**The Meaning Before Accent Rule.** Use violet and amber for publication identity and action; preserve explicit text labels for live, upcoming, saved and selected states.

## Typography

**Display Font:** self-hosted Roboto Condensed 800, registered in CSS as `Programme`; Arial Narrow and sans-serif are fallback families.
**Body Font:** self-hosted Public Sans, regular and bold; system-ui is a fallback, not the display identity.

The scale is role-based, not a fixed mathematical ratio. The condensed family gives headings a programme-like density while the body remains open and comfortable. There is no separate monospace or decorative label face.

### Hierarchy

- **Display:** page titles use the frontmatter display role. Home, event and guide heroes have their own measured overrides; the home's larger cover title is not the universal title size.
- **Headline:** major section headings use the headline role, with reading sections commonly using a fixed (32–36px) size.
- **Title:** article previews and subordinate headings share the condensed title role; card and planner contexts use nearby, explicit sizes.
- **Body:** everyday explanatory text uses the body role; short card summaries use (14–15px).
- **Reading:** guide and visitor narratives use the reading role. Guide bodies cap at (76ch), visitor bodies at (78ch), and individual paragraphs commonly at (65–72ch).
- **Label:** bold form and fact labels use the label role. Quiet metadata remains sentence case; tiny image credits are not a general-purpose label scale.

At narrow widths (680px and below), the base body becomes (15px), long-form reading becomes (17px), and major title sizes are adjusted by the owning template. Keep those local overrides rather than shrinking the entire site proportionally.

**The Two Reading Speeds Rule.** Let condensed headings support scanning and uncondensed prose support sustained reading; do not use the display family for article paragraphs.

## Layout

A shared content shell caps at (1440px), with the fluid gutter token on both sides. The masthead and introductory home region cap at (1600px); full-width editorial bands retain aligned content. At (680px and below), the horizontal gutter becomes (22px).

Spacing is an observed set of repeated increments, not a mandatory eight-point grid. Reuse the recorded increments for controls and rhythm while preserving content-specific gaps, including (18px), (26px) and (36px), where the templates already use them.

- Experience grids move from three columns to two at (800px), then one at (680px). Saved-place cards move from two columns to one at (680px).
- Article layouts pair a reading column with either a guide contents rail or an event facts rail. At (800px), these become a single reading flow; event facts move before the article.
- The desktop masthead becomes a wrapped header at (800px), with a visible text-navigation row. Policy navigation and the guide contents rail stop being sticky at this breakpoint.
- At (1100px), the site narrows gaps, reduces masthead density and removes its supporting brand note. At (1600px and above), wide editorial bands increase outer padding to maintain alignment.
- Reading tables scroll within their own wrapper; long source links may wrap. These are content accommodations, not permission for page-wide horizontal overflow.

**The Reading Surface Rule.** Use distinct reading, evidence and planning regions, but keep them in one navigable document flow when columns collapse.

## Elevation & Depth

The durable system is flat. White, lavender and violet regions establish hierarchy; fine rules separate related items. Images, type scale and whitespace carry the depth. There is no reusable card-shadow or hover-lift scale.

The current fixed saved-summary tray has a local shadow, and navigation uses a bottom box-shadow as a line indicator. Neither is a general elevation token. The cover's short image reveal is similarly local; it is not a site-wide entrance-animation rule. Reduced-motion preferences disable animations and transitions and remove smooth scrolling.

**The Flat Reading Rule.** Keep article containers and programme cards flat; use tonal regions and rules before introducing elevation.

## Shapes

Editorial fields, photographs and reading containers are square-edged. Controls use the modest control radius; this is not a pill-based system. Fine (1px) borders are the default boundary language. The large cover action and saved-summary tray retain their local corner values rather than extending the shared radius scale.

Authored inline SVG icons use rounded strokes, usually (1.8px), and inherit surrounding text color. Icons support a readable label or a meaningful link; they do not replace source context.

## Components

### Buttons

Confident, rectangular actions. The primary variant uses amber with violet text; the secondary variant uses paper, ink and a fine line border. Both use bold body type (14px), a minimum height of (48px), and the frontmatter padding.

Primary hover lightens the existing amber; secondary hover uses lavender. Keyboard focus uses a (3px) focus-color outline offset by (5px). Disabled buttons reduce opacity to (0.5) and use a not-allowed cursor. No shared transition or active transform is defined. Compact article actions and the cover action remain local variants.

### Saved-place toggle

A quiet control that becomes unambiguously selected. The default is paper with a line border, bold body text (13px), and a minimum height of (44px). Hover strengthens the border to violet. The pressed state uses violet and white and changes its label from “Save to plan” to “Saved to plan”. Preserve `aria-pressed`; saving is not booking.

### Filters and fields

Search and native selects sit in a lavender tools region. Labels are separate, visible and bold. Fields have a fine border, control-radius corners, minimum height (46px) and native keyboard behavior. All use the shared focus outline.

Category controls are rectangular white buttons with a violet-and-white `aria-pressed` state. Their existing (40px) minimum height is not the target for new general-purpose controls. No custom error, loading or disabled-field design is implemented; do not imply one exists.

### Navigation

Readable text links beside the condensed wordmark. Desktop links use bold body type (14px), a minimum height of (44px), and an amber underline-like indicator on hover or `aria-current`. Narrow layouts retain the visible link row rather than replacing it with an undocumented menu. The sticky guide and policy rails become ordinary flow content on smaller screens.

### Programme cards and saved cards

Experience previews are unboxed image-and-text units separated by a bottom rule, with a distinct reading link and save control. Photos use the template's landscape ratio; source illustrations that should not be cropped use a contain treatment on lavender.

Saved cards are square lavender regions with condensed titles, quiet metadata, Korean map names and separate text/action links. The empty plan uses the same lavender material, an explanation and a route back to experiences. Calendar export and clear actions are disabled while the saved list is empty.

### Calendar rows

A ruled list rather than a wall of date cards. Each row separates date, condensed experience title, supporting location text and textual status. Hover adds lavender. The narrow layout moves the date above the title and keeps the status distinct; the whole row remains a semantic link.

### Evidence disclosure

Native `details` and `summary` keep source material accessible without making it the main reading hierarchy. Fine rules bound the disclosure; bold body text marks the summary. Opening it adds space before the evidence entries. Source names remain links, and dated support statements remain text, not decorative verification badges.

## Do's and Don'ts

### Do:

- **Do** use real, source-linked cultural imagery and keep contextual credits adjacent to the image.
- **Do** preserve the distinction between article prose, supporting facts and source evidence.
- **Do** retain visible keyboard focus, semantic links and buttons, pressed labels and meaningful empty states.
- **Do** let long reading columns and navigation reflow into a single usable document on narrow screens.
- **Do** treat saving as a browser shortlist, never as a confirmed reservation.

### Don't:

- **Don't** replace article substance with repeated badges, scores, counters or checklists.
- **Don't** turn the homepage's exact cover split or image crop into a requirement for every surface.
- **Don't** introduce glass panels, decorative card shadows or pill-shaped containers into the flat publication system.
- **Don't** use tiny credit text as the default size for navigation, controls or article prose.
- **Don't** add invented first-hand claims, image rights or verification states to make a visual more persuasive.
