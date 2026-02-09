# Theme System Quick Start Guide

## 🚀 What's New?

Your SmartGrade application now has a complete theme system with **light and dark modes** with a professional color palette:

- **Primary Color**: Navy Blue (Professional & Trustworthy)
- **Secondary Color**: Gold (Elegant & Accents)
- **Semantic Colors**: Green (Success), Gold (Warning), Red (Error)

## 🎯 For Users

### How to Switch Themes

1. Look for the **sun/moon icon** in the top navbar (top-right area)
2. Click it to open the theme menu
3. Select one of three options:
   - **Light** - Always use light theme
   - **Dark** - Always use dark theme  
   - **System** - Follow your device's theme preference (default)

Your choice is automatically saved!

## 💻 For Developers

### Using the Theme Context

```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div className="bg-background text-foreground">
      Current theme: {resolvedTheme}
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Available Colors in Components

Use Tailwind classes with the theme colors:

```tsx
// Background & Text
<div className="bg-background text-foreground">
  Content
</div>

// Primary (Navy)
<button className="bg-primary text-primary-foreground">
  Primary Button
</button>

// Secondary (Gold)
<button className="bg-secondary text-secondary-foreground">
  Secondary Button
</button>

// Semantic colors
<div className="bg-success text-success-foreground">Success</div>
<div className="bg-warning text-warning-foreground">Warning</div>
<div className="bg-destructive text-destructive-foreground">Error</div>

// Cards
<div className="bg-card text-card-foreground rounded-lg p-4">
  Card content
</div>
```

### CSS Variables (Direct CSS)

If you need to use colors in plain CSS:

```css
.my-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--border));
}
```

### Adding Theme Toggle to Components

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

function Navbar() {
  return (
    <nav>
      {/* other nav items */}
      <ThemeToggle />
    </nav>
  );
}
```

## 🎨 Color Reference

### Light Mode Values
```
Primary (Navy):      hsl(220 70% 18%)
Secondary (Gold):    hsl(45 93% 47%)
Background:          hsl(220 20% 97%)
Foreground:          hsl(220 25% 10%)
Card:                hsl(0 0% 100%)
Success:             hsl(142 76% 36%)
Warning:             hsl(45 93% 47%)
Destructive (Red):   hsl(0 84% 60%)
```

### Dark Mode Values
```
Primary:             hsl(220 70% 35%)
Secondary:           hsl(45 93% 50%)
Background:          hsl(220 25% 6%)
Foreground:          hsl(0 0% 95%)
Card:                hsl(220 25% 10%)
Success:             hsl(142 76% 50%)
Warning:             hsl(45 93% 55%)
Destructive:         hsl(0 84% 65%)
```

## 📁 Files Modified/Created

- **New**: `src/contexts/ThemeContext.tsx` - Theme state management
- **New**: `src/components/ThemeToggle.tsx` - Theme switcher UI
- **Updated**: `src/App.tsx` - Added ThemeProvider wrapper
- **Updated**: `src/components/Navbar.tsx` - Added ThemeToggle button
- **Existing**: `src/index.css` - Already has light/dark CSS variables
- **Existing**: `tailwind.config.ts` - Already configured for theme

## 🔧 Customization

### Change Primary Color

Edit `src/index.css`:

```css
:root {
  --primary: 220 70% 18%;  /* Change these numbers */
}

.dark {
  --primary: 220 70% 35%;
}
```

### Add New Semantic Color

In `src/index.css`:

```css
:root {
  --info: 200 85% 50%;
  --info-foreground: 0 0% 100%;
}

.dark {
  --info: 200 85% 55%;
  --info-foreground: 0 0% 100%;
}
```

In `tailwind.config.ts`:

```typescript
info: {
  DEFAULT: "hsl(var(--info))",
  foreground: "hsl(var(--info-foreground))",
},
```

Then use in components:
```tsx
<div className="bg-info text-info-foreground">Info message</div>
```

## ✅ Testing

The theme system works by:
1. Checking localStorage for saved preference
2. If "system" mode, listening to OS theme preference
3. Adding/removing "dark" class on `<html>` element
4. CSS variables automatically adjust

To test:
1. Open DevTools → Application → Local Storage
2. Look for "theme" key
3. Try switching themes and see the value change
4. Try changing your OS theme and watch it update automatically

## 📚 Full Documentation

See [THEME_DOCUMENTATION.md](./THEME_DOCUMENTATION.md) for detailed documentation.
