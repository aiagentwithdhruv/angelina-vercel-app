# Angelina AI – Design System (FINAL)

> Futuristic, minimal, gunmetal + subtle cyan glow aesthetic

**Status:** ✅ APPROVED  
**Last Updated:** February 4, 2026

---

## 🎨 Color Palette (Final)

### Backgrounds (Gray Scale)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Deep Space** | `#0a0a0f` | 10, 10, 15 | Primary background |
| **Charcoal** | `#141418` | 20, 20, 24 | Card backgrounds |
| **Gunmetal** | `#1e1e24` | 30, 30, 36 | Surface elements |
| **Steel Dark** | `#2a2a32` | 42, 42, 50 | Borders, dividers |
| **Steel Mid** | `#3a3a44` | 58, 58, 68 | Hover states |
| **Steel Light** | `#4a4a56` | 74, 74, 86 | Active states |

### Metallic Text Gradient

| Name | Hex | Usage |
|------|-----|-------|
| **Metal Highlight** | `#f0f0f5` | Top of gradient |
| **Metal Light** | `#c8c8d0` | Upper mid |
| **Metal Mid** | `#8a8a96` | Center |
| **Metal Dark** | `#5a5a66` | Lower mid |
| **Metal Shadow** | `#3a3a44` | Bottom |

### Accent (Subtle Cyan - Use Sparingly)

| Name | Hex | Usage |
|------|-----|-------|
| **Cyan Glow** | `#00c8e8` | Primary accent, glows |
| **Cyan Teal** | `#00a8b8` | Secondary accent |

### Glow Opacity Levels

```css
--glow-soft: rgba(0, 200, 232, 0.4);     /* Strong glow */
--glow-medium: rgba(0, 200, 232, 0.25);  /* Medium glow */
--glow-subtle: rgba(0, 200, 232, 0.12);  /* Subtle glow */
```

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#e0e0e8` | Main text, headings |
| **Text Secondary** | `#9090a0` | Body text |
| **Text Muted** | `#606070` | Labels, captions |

---

## 🌟 Glow Effects (Key Feature)

### Card Glow
```css
/* Border glow gradient */
.card::before {
  background: linear-gradient(135deg, 
    rgba(0, 200, 232, 0.3) 0%,
    transparent 25%,
    transparent 50%,
    rgba(0, 168, 184, 0.2) 75%,
    rgba(0, 200, 232, 0.3) 100%
  );
  opacity: 0.3;
}

/* Outer glow shadow */
.card::after {
  box-shadow: 
    0 0 15px rgba(0, 200, 232, 0.12),
    0 0 30px rgba(0, 200, 232, 0.05);
}

/* Hover intensifies */
.card:hover::after {
  box-shadow: 
    0 0 20px rgba(0, 200, 232, 0.25),
    0 0 40px rgba(0, 200, 232, 0.12);
}
```

### Icon Ring Glow
```css
.icon-ring {
  box-shadow: 
    inset 0 2px 4px rgba(255,255,255,0.1),
    inset 0 -2px 4px rgba(0,0,0,0.3),
    0 0 30px rgba(0, 200, 232, 0.25),
    0 0 60px rgba(0, 200, 232, 0.12);
}
```

### Input Focus Glow
```css
.input:focus {
  border-color: rgba(0, 200, 232, 0.4);
  box-shadow: 
    0 0 15px rgba(0, 200, 232, 0.25),
    0 0 30px rgba(0, 200, 232, 0.12);
}
```

---

## 📝 Typography

### Fonts
```css
/* Headings - Futuristic */
font-family: 'Orbitron', sans-serif;

/* Body - Clean */
font-family: 'Inter', system-ui, sans-serif;

/* Code/Technical */
font-family: 'JetBrains Mono', monospace;
```

### Metallic Text Effect
```css
.metallic-text {
  background: linear-gradient(
    180deg,
    #f0f0f5 0%,    /* highlight */
    #c8c8d0 20%,   /* light */
    #8a8a96 40%,   /* mid */
    #5a5a66 60%,   /* dark */
    #8a8a96 80%,   /* mid */
    #c8c8d0 100%   /* light */
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
}
```

---

## 🧩 Component Styles

### Cards
- Gradient background (gunmetal → charcoal → deep space)
- Glowing cyan border (subtle)
- Top edge glow line
- Hover: border intensifies, outer glow grows

### Buttons
- **Primary**: Metallic steel gradient, subtle glow
- **Secondary**: Transparent, cyan border with glow
- **Ghost**: Transparent, steel border

### Inputs
- Charcoal background
- Subtle cyan border
- Focus: border brightens, glow appears

### Badges
- Steel gradient background
- Cyan border glow
- Pulsing dot for status

### Avatar Rings
- Circular steel gradient
- Glowing cyan border ring
- Multi-layer outer glow

---

## 🎭 Design Principles

1. **Gunmetal First** – Gray/steel is the primary color
2. **Cyan as Accent** – Use sparingly for glow and highlights
3. **Glowing Edges** – All interactive elements have subtle glow
4. **Metallic Text** – Headings use brushed steel gradient
5. **Depth** – Layered shadows and gradients create dimension
6. **Minimal** – Clean layouts, no clutter

---

## 📐 Spacing Scale

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

---

## 📱 Mobile Design (React Native)

### Same Design System
All colors, typography, and component styles apply to mobile. Use these as React Native StyleSheet values.

### Mobile-Specific Adaptations

**Touch Targets:**
```javascript
minHeight: 44,
minWidth: 44,
```

**Bottom Navigation:**
```javascript
// Active tab has cyan glow
activeTabStyle: {
  borderBottomWidth: 2,
  borderBottomColor: '#00c8e8',
  shadowColor: '#00c8e8',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
}
```

**Floating Action Button (Voice):**
```javascript
fab: {
  position: 'absolute',
  bottom: 24,
  right: 24,
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#1e1e24',
  borderWidth: 1,
  borderColor: 'rgba(0, 200, 232, 0.3)',
  shadowColor: '#00c8e8',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 15,
  elevation: 8,
}
```

**Card Glow (Mobile):**
```javascript
card: {
  backgroundColor: '#141418',
  borderWidth: 1,
  borderColor: 'rgba(0, 200, 232, 0.2)',
  borderRadius: 12,
  shadowColor: '#00c8e8',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 5,
}
```

### Mobile Navigation Structure
```
├── Chat (Home)
│   └── Floating voice button
├── Activity
│   └── Real-time feed
├── Dashboard
│   └── Stats & metrics
└── Settings
    └── Account, preferences
```

---

## 📄 Reference Files

- `preview.html` – Live preview of all components (web)
- `PRD-STORY.md` – Product brief for AI generation (web + mobile)

---

**Platforms:** Web + Android (iOS future)
**Status:** Ready for UI implementation
