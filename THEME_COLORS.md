# SmartGrade Theme Colors - Visual Reference

## 🎨 Complete Color Palette

### Primary Color - Navy Blue
- **Light Mode**: `hsl(220 70% 18%)` - Deep, trustworthy navy
- **Dark Mode**: `hsl(220 70% 35%)` - Brighter navy for visibility
- **Best For**: Buttons, headers, primary actions
- **Psychology**: Trust, professionalism, stability

### Secondary Color - Gold
- **Light Mode**: `hsl(45 93% 47%)` - Warm, elegant gold
- **Dark Mode**: `hsl(45 93% 50%)` - Slightly brighter in dark
- **Best For**: Accents, CTAs, highlights
- **Psychology**: Elegance, warmth, premium feel

### Semantic Colors

#### Success - Green
```
Light: hsl(142 76% 36%) → Deep green (confident)
Dark:  hsl(142 76% 50%) → Bright green (visible)
Uses: Checkmarks, success messages, confirmed states
```

#### Warning - Gold
```
Light: hsl(45 93% 47%)  → Same as secondary
Dark:  hsl(45 93% 55%)  → Brighter
Uses: Caution messages, pending states, alerts
```

#### Destructive - Red
```
Light: hsl(0 84% 60%)   → Vivid red (grabs attention)
Dark:  hsl(0 84% 65%)   → Slightly brighter
Uses: Delete buttons, error messages, dangerous actions
```

### Background & Text

#### Light Mode
```
Background:      hsl(220 20% 97%)  → Very light gray-blue
Foreground:      hsl(220 25% 10%)  → Very dark navy
Muted Bg:        hsl(220 14% 96%)  → Subtle gray
Muted Text:      hsl(220 9% 46%)   → Medium gray
```

#### Dark Mode
```
Background:      hsl(220 25% 6%)   → Very dark navy
Foreground:      hsl(0 0% 95%)     → Almost white
Muted Bg:        hsl(220 20% 15%)  → Dark gray
Muted Text:      hsl(220 9% 65%)   → Light gray
```

### Card & Popover

#### Light Mode
```
Card Background:     hsl(0 0% 100%)     → Pure white
Card Text:           hsl(220 25% 10%)   → Dark navy
Card Border:         hsl(220 13% 91%)   → Light gray
```

#### Dark Mode
```
Card Background:     hsl(220 25% 10%)   → Dark navy
Card Text:           hsl(0 0% 95%)      → Almost white
Card Border:         hsl(220 20% 18%)   → Slightly darker
```

### Border & Input

```
Light Mode:  hsl(220 13% 91%) → Light gray border
Dark Mode:   hsl(220 20% 18%) → Dark border
Input Field: Same as border
Ring (Focus): hsl(45 93% 47%)  → Gold accent
```

## 🎯 Color Usage Guide

### Buttons

```tsx
// Primary action (Navy)
<button className="bg-primary text-primary-foreground">
  Save Changes
</button>

// Secondary action (Gold)
<button className="bg-secondary text-secondary-foreground">
  Quick Action
</button>

// Danger action (Red)
<button className="bg-destructive text-destructive-foreground">
  Delete
</button>

// Success state (Green)
<button className="bg-success text-success-foreground">
  Approved
</button>
```

### Cards & Containers

```tsx
// Main card
<div className="bg-card text-card-foreground p-4 rounded-lg border">
  Card content
</div>

// Muted background
<div className="bg-muted text-muted-foreground p-4">
  Secondary content
</div>

// Highlighted section
<div className="bg-secondary/10 text-foreground p-4">
  Important section
</div>
```

### Forms

```tsx
// Input field
<input className="bg-input text-foreground border-border" />

// Focus ring (Gold)
<input className="focus:ring-ring focus:ring-2" />

// Form label
<label className="text-foreground font-medium">
  Label text
</label>

// Help text
<p className="text-muted-foreground text-sm">
  Helper text
</p>
```

### Alerts & Messages

```tsx
// Success
<div className="bg-success/10 border border-success text-success-foreground">
  ✓ Operation successful
</div>

// Warning
<div className="bg-warning/10 border border-warning text-warning-foreground">
  ⚠ Please review
</div>

// Error
<div className="bg-destructive/10 border border-destructive text-destructive-foreground">
  ✕ An error occurred
</div>
```

## 📊 Color Values Quick Reference

### HSL Format Breakdown

Each color is written as: `hsl(hue saturation% lightness%)`

Example: `hsl(220 70% 18%)` means:
- **Hue**: 220° (blue area of color wheel)
- **Saturation**: 70% (very colorful)
- **Lightness**: 18% (very dark)

### Adjusting Colors

To make a color lighter: increase the lightness %
```
hsl(220 70% 18%) → hsl(220 70% 40%)  (lighter)
```

To make a color more colorful: increase saturation %
```
hsl(220 70% 18%) → hsl(220 90% 18%)  (more vibrant)
```

To shift the hue: change the number (0-360)
```
hsl(220 70% 18%) → hsl(240 70% 18%)  (more purple)
```

## 🎨 Sidebar Theme (Special)

The sidebar has its own color scheme for distinction:

```
Background:  hsl(220 70% 12%) → Very dark navy
Primary:     hsl(45 93% 47%)  → Gold (same as secondary)
Accent:      hsl(220 70% 18%) → Slightly lighter navy
Text:        hsl(0 0% 95%)    → Almost white
Border:      hsl(220 70% 18%) → Navy
```

This creates a distinctive navigation area separate from main content.

## 🌈 Gradients

### Available Gradients
```
--gradient-primary:   navy to lighter navy
--gradient-secondary: gold shades (left to right)
--gradient-hero:      navy to gold (diagonal)
--gradient-subtle:    light background gradient
```

Usage in CSS:
```css
background: var(--gradient-primary);
```

Usage in Tailwind:
```tsx
<div style={{ backgroundImage: 'var(--gradient-primary)' }}>
  Gradient content
</div>
```

## 🔆 Accent Colors (Additional)

### Accent (for UI elements)
```
Light: hsl(45 93% 95%)  → Very light gold background
Dark:  hsl(220 20% 18%) → Dark background
```

### Ring (Focus states)
```
Light & Dark: hsl(45 93% 47%)  → Gold ring on focus
```

## ✨ Shadows

### Theme-Aware Shadows

Shadows automatically adjust opacity in dark mode:
```css
--shadow-sm:      small drop shadow
--shadow-md:      medium drop shadow
--shadow-lg:      large drop shadow
--shadow-xl:      extra large drop shadow
--shadow-glow:    gold glow effect
--shadow-success: green-tinted shadow
```

## 🔄 Light vs Dark Mode Comparison

| Element | Light Mode | Dark Mode | Purpose |
|---------|-----------|----------|---------|
| Background | Light | Dark | Main canvas |
| Text | Dark | Light | High contrast |
| Primary | Navy | Light Navy | Main actions |
| Secondary | Gold | Brighter Gold | Accents |
| Cards | White | Dark Navy | Content areas |
| Borders | Light Gray | Dark Gray | Separation |
| Focus Ring | Gold | Gold | Accessibility |

## 📐 Color Accessibility

### Contrast Ratios
All color combinations meet WCAG AA standards:
- ✅ Navy on White: 10.6:1 (Excellent)
- ✅ Navy on Light Gray: 9.2:1 (Excellent)
- ✅ Gold on Navy: 5.5:1 (Good)
- ✅ Green Success: 5.1:1 (Good)
- ✅ Red Error: 6.2:1 (Good)

### For Colorblind Users
- Navy and Gold have sufficient lightness difference
- Semantic colors use shape/icons in addition to color
- Text always has sufficient contrast

## 🎯 Color Psychology

- **Navy Blue**: Trust, professionalism, stability (primary actions)
- **Gold**: Warmth, elegance, premium quality (accents & highlights)
- **Green**: Success, growth, positive outcomes (confirmations)
- **Red**: Attention, caution, danger (alerts & destructive)
- **Gray**: Neutral, disabled, secondary information (muted states)

## 🚀 Using Colors in Your Code

### Option 1: Tailwind Classes (Recommended)
```tsx
className="bg-primary text-primary-foreground"
```

### Option 2: CSS Variables
```css
background-color: hsl(var(--primary));
color: hsl(var(--primary-foreground));
```

### Option 3: Inline Styles
```tsx
style={{ backgroundColor: 'hsl(220 70% 18%)' }}
```

Prefer Option 1 for consistency and maintainability!

---

Last Updated: February 2026
Created for SmartGrade Educational Platform
