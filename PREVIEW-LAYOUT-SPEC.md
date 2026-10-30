# Preview layout spec (source of truth for the rebuild)

Source: the shared SasyaSakhi preview link, observed at desktop width (~1366px).
Rule from the user: copy this UI/UX layout AS IS into the real app, EXCEPT the
features he has changed (those stay as the real app has them).

## Global
- Page background: warm cream/ivory (~#F6F3E9). Cards white with subtle grey borders.
- Deep forest green (~#0C3B2E) for footer, sidebar, technology panel, selected
  language pill, primary dark buttons. Gold/amber accent (~#D9A545) for CTA
  buttons, the italic headline line, badge dots/text. Headings near-black
  charcoal (~#1A1A18). Body text muted grey. Pale sage green (~#EAF0E4) for
  the How-It-Works band and small date/weather tiles.
- Fonts: transitional serif (editorial, high-contrast) for ALL big headings,
  logo wordmark, hero headline, card titles. Clean sans for nav links, buttons,
  body copy, stat labels, microcopy. Eyebrow labels: sans, uppercase,
  letter-spaced, dark green.
- All buttons fully rounded (pills), never square.

## Top navigation bar
- Full-width, edge-to-edge (NOT floating/inset), cream/ivory background, thin
  bottom divider, sticky (pinned on scroll).
- Left: dark-green circle with light sprout/leaf icon + "SasyaSakhi" bold serif.
- Centre: nav links in dark sans, in order: Home, Features, How It Works,
  Crops, About. They scroll/jump to sections.
- Right, in order: language pill toggle (EN selected as dark-green pill,
  Telugu unselected plain text on cream), "Sign In" (outline pill, cream fill,
  dark text, thin border), "Get Started" (gold filled pill, dark text).

## Hero
- Full-viewport-height, full-bleed PHOTO background: green paddy fields in
  foreground, tree line, forested hills behind, monsoon clouds above. Dark
  gradient overlay fading in from the bottom so white text stays legible.
- TWO COLUMNS inside a centred max-width container with side gutters.
  Left column (~55-60%): badge, headline, subtext, buttons, microcopy.
  Right column (~35-40%): frosted-glass sample card, vertically centred.
- Badge above headline: small dark (near-black/brown) pill, gold dot + gold
  uppercase text.
- Headline, large display serif, three lines, left column: line 1 white,
  line 2 GOLD ITALIC serif, line 3 white.
- Subtext: white sans below the headline.
- Hero buttons, left-aligned under subtext, in order: (1) gold filled pill,
  dark text; (2) transparent pill, white outline, white text.
- Below buttons, one line of small white sans microcopy (free prototype /
  no account needed / works on any phone).

## Hero sample card
- Frosted-glass card: translucent dark-green background, subtle white border,
  rounded corners, in the hero right column.
- Title row: serif title left, small outlined pill "Demo" badge right.
- Subtitle line: farm name, district, report number (small white sans).
- Three dark-green stat boxes in a row (small uppercase-ish grey-white labels,
  large white bold values), then one small line for EC, then a bold
  "Best match" line + smaller explanation line.
- Bottom: full-width gold pill button, dark text, centred.

## Sections below the hero (in order)
1. FEATURES, cream background. Eyebrow + serif heading + subtext. Card grid of
   white rounded cards, each with a light-green rounded-square icon tile, bold
   serif title, grey sans body, green arrow text link. Rows: 3 cards, 3 cards,
   then 2 cards (second row's last card is a photo card with white overlaid
   text; the other is a language card with a globe icon).
2. HOW IT WORKS, pale sage/green tint band. Eyebrow + heading + subtext. SEVEN
   clickable white cards in ONE ROW, left to right, each with a dark-green
   numbered circle, bold sans title, small grey description.
3. HOW THE SCORES WORK. Eyebrow + heading + subtext. Three white article cards
   in a row. Below them, left-aligned dark-green filled pill button.
4. CROP SHOWCASE. Eyebrow + heading + subtext. Three large white cards in a
   row; each has an image area on top, serif crop name, small grey season
   line, and a row with grey "Suitability" label + bold match verdict.
   NOTE: the preview's crop images did NOT load (blank areas) — do NOT copy
   blank image areas; keep the real app's crop cards.
5. TECHNOLOGY & TRUST. Dark-green rounded-rectangle inset panel (large corner
   radius, subtle dot texture) on the cream page. Inside: small dark pill
   badge (gold text), serif white heading, light-grey body, three equal
   columns with GOLD serif numbered subheads, bottom row of buttons (gold
   filled pill + outline pill, white text).

## Footer
- Full-width dark-green band. Three columns: (1) brand: white-circle leaf logo
  + serif name + tagline; (2) "Explore" links: Features, How It Works, Crops,
  Open the demo dashboard; (3) "Contact" links: Email the team, Farmer
  support, Privacy (prototype note), Terms (prototype note).
- Below a thin divider, small grey prototype disclaimer text.

## App shell (dashboard)
- LEFT SIDEBAR, dark green, full height. Top: leaf-circle logo + white serif
  name. Nav items with line icons, in order: Overview (active, gold left-edge
  indicator bar), Soil Reports, Soil Health, Crop Recommendations, Fertilizer
  Planner, Weather, Zone & Water, Crop Calendar, Season Tracker, Sakhi
  Assistant, Settings. Bottom: dark pill "DEMO BUILD" badge (gold text) +
  tiny grey text. NO bottom navigation bar.
- TOP BAR, cream: left outline pill Back button + serif page heading with
  subtext; right: language pill toggle, bell icon button, dark circular
  profile avatar button.
- MAIN CONTENT, cream background: dark-green rounded hero banner (dot
  texture) with greeting + farm line + Demo badge + gold button; then card
  rows as the real app already has them.

## What the real app KEEPS (features he changed — do NOT replace with preview)
- My-crop page and flow, Sakhi pet, satellite conditional guidance, demo-label
  behaviour, the "How to Use This" modal and button, the "I Already Have a
  Crop" button, current sample card VALUES, all routes and functionality.
- The preview's sign-up panel is NOT built (no login by his decision); the
  navbar Sign In / Get Started buttons stay as the real app already has them,
  restyled to the preview's pill style.
- Desktop uses the preview's two-column layout; small screens keep a stacked
  responsive layout (the complaint was about desktop alignment, not mobile).
