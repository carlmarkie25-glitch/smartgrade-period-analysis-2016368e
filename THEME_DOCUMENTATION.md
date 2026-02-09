# SmartGrade Theme System Documentation

## Overview

The SmartGrade application now includes a professional theme system with light and dark modes, featuring a carefully chosen color palette optimized for educational applications.

## Color Palette

### Primary Colors
- **Primary (Navy)**: `hsl(220 70% 18%)` - Used for main interactive elements
  - Light mode: Deep navy blue
  - Dark mode: Lighter blue shade
  
- **Secondary (Gold)**: `hsl(45 93% 47%)` - Accent and highlights
  - Complements the primary color
  - Great for CTAs and important elements

### Semantic Colors
- **Success**: `hsl(142 76% 36%)` - Green for positive actions
- **Warning**: `hsl(45 93% 47%)` - Gold/yellow for caution
- **Destructive**: `hsl(0 84% 60%)` - Red for dangerous actions
- **Muted**: Gray tones for disabled/secondary content

### Theme-Specific Variables

#### Light Mode
- Background: `hsl(220 20% 97%)` - Clean, light gray-blue
- Foreground: `hsl(220 25% 10%)` - Dark text
- Card: `hsl(0 0% 100%)` - Pure white cards

#### Dark Mode
- Background: `hsl(220 25% 6%)` - Very dark blue-gray
- Foreground: `hsl(0 0% 95%)` - Light text
- Card: `hsl(220 25% 10%)` - Slightly lighter dark shade

## Implementation

### Theme Context

The theme system is managed through the `ThemeContext` which handles:
- Theme state management (light/dark/system)
- DOM class manipulation
- LocalStorage persistence
- System preference detection

**Location**: [src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx)

```tsx
const { theme, setTheme, resolvedTheme } = useTheme();
```

### Usage

#### In Components
```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Current theme: {resolvedTheme}
    </button>
  );
}
```

#### Theme Toggle Component
The `ThemeToggle` component provides a user-friendly dropdown menu to switch themes:

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

function Navbar() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  );
}
```

## CSS Variables

All colors are defined as CSS variables in [src/index.css](src/index.css) using HSL format for easy manipulation:

```css
:root {
  --primary: 220 70% 18%;
  --secondary: 45 93% 47%;
  --success: 142 76% 36%;
  --warning: 45 93% 47%;
  --destructive: 0 84% 60%;
  /* ... more variables */
}

.dark {
  --primary: 220 70% 35%;
  --secondary: 45 93% 50%;
  /* ... adjusted for dark mode */
}
```

## Tailwind Integration

The theme variables are integrated with Tailwind CSS in [tailwind.config.ts](tailwind.config.ts):

```typescript
colors: {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
    glow: "hsl(var(--primary-glow))",
  },
  // ... other colors
}
```

## Features

### ✨ Smart Theme Detection
- Respects user's system preference when set to "system"
- Listens for changes in system theme preference
- Persists user choice in localStorage

### 🎨 Professional Color Scheme
- Navy blue primary color (trustworthy, professional)
- Gold secondary color (elegant, accents)
- Well-chosen semantic colors for success, warning, and errors
- Optimized contrast ratios for accessibility

### 🔄 Smooth Transitions
- CSS transitions for theme changes
- No jarring color flashes
- Animations fade smoothly between themes

### 📱 Responsive Design
- Works seamlessly across all device sizes
- Touch-friendly theme toggle
- Dropdown menu for easy selection

## Theme Options

Users can choose from three theme modes:

| Mode | Behavior |
|------|----------|
| **Light** | Always light theme, regardless of system preference |
| **Dark** | Always dark theme, regardless of system preference |
| **System** | Follows operating system theme preference (default) |

## Accessibility

The theme system prioritizes accessibility:
- Sufficient contrast ratios (WCAG AA compliant)
- Clear visual feedback for interactive elements
- Respects `prefers-color-scheme` media query
- Smooth transitions prevent motion sickness

## Customization

To modify colors, edit the CSS variables in [src/index.css](src/index.css):

```css
:root {
  --primary: 220 70% 18%;  /* Change primary color */
  --secondary: 45 93% 47%; /* Change secondary color */
}
```

The format is: `hue saturation lightness`
- Hue: 0-360
- Saturation: 0-100%
- Lightness: 0-100%

## Sidebar Theme

The sidebar has its own dedicated color variables for a distinctive dark navy appearance:
- Background: `hsl(220 70% 12%)`
- Primary: `hsl(45 93% 47%)`
- Accent: `hsl(220 70% 18%)`

## Gradients

Pre-defined gradients are available for visual richness:
- `var(--gradient-primary)` - Primary gradient (navy to slightly lighter navy)
- `var(--gradient-secondary)` - Secondary gradient (gold shades)
- `var(--gradient-hero)` - Hero section gradient (navy to gold)
- `var(--gradient-subtle)` - Subtle background gradient

## Shadows

Theme-aware shadows for depth:
- Shadow Small, Medium, Large, XL - Automatically adjust opacity in dark mode
- `var(--shadow-glow)` - Glowing effect for highlights
- `var(--shadow-success)` - Success-specific shadow

## Browser Support

The theme system works in all modern browsers:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Future Enhancements

Potential improvements:
- Additional color theme presets (nature, ocean, autumn, etc.)
- Custom color picker for personalization
- Per-component theme overrides
- Animated theme transitions
