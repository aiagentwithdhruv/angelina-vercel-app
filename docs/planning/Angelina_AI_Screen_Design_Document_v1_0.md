# **ANGELINA AI**

## Personal AI Operating System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **SCREEN-BY-SCREEN DESIGN SPECIFICATION**

Complete UI/UX Blueprint for Web + Android

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**TWO INTEGRATED PLATFORMS**

**WEB APPLICATION** (Next.js - Desktop + Responsive)

**ANDROID APP** (React Native - Mobile First)

Version 1.0 | February 2026

---

# Table of Contents

1. Design System Foundation
2. Web Application Screens
3. Android Mobile Screens  
4. Component Library
5. Interaction & Animation Specs
6. Responsive Guidelines
7. Implementation Notes

---

# 1. Design System Foundation

## 1.1 Color System

The Angelina color system is built around **Gunmetal Dark** as the primary aesthetic with **Cyan Glow** accents, creating a futuristic, premium feel.

### Background Colors

| **Color Name** | **Hex Code** | **Usage** |
|----------------|--------------|-----------|
| Deep Space | #0a0a0f | Primary page background, base layer |
| Charcoal | #141418 | Card backgrounds, input fields, secondary surfaces |
| Gunmetal | #1e1e24 | Surface elements, button backgrounds, FAB |
| Steel Dark | #2a2a32 | Borders, dividers, inactive elements |
| Steel Mid | #3a3a44 | Hover states, secondary borders |
| Steel Light | #4a4a56 | Active states, pressed buttons |

### Accent Colors

| **Color Name** | **Hex Code** | **Usage** |
|----------------|--------------|-----------|
| Cyan Glow | #00c8e8 | Primary accent, glows, active states, links |
| Cyan Teal | #00a8b8 | Secondary accent, hover states |

### Text Colors

| **Color Name** | **Hex Code** | **Usage** |
|----------------|--------------|-----------|
| Text Primary | #e0e0e8 | Headlines, main content, important labels |
| Text Secondary | #9090a0 | Body text, descriptions, secondary content |
| Text Muted | #606070 | Labels, captions, timestamps, placeholders |

### Semantic Colors

| **Color Name** | **Hex Code** | **Usage** |
|----------------|--------------|-----------|
| Success | #00e88c | Success messages, completed status, connected |
| Warning | #e8a800 | Warning alerts, pending status, executing |
| Error | #e84040 | Error messages, failed status, destructive |

### Glow Opacity Levels

| **Level** | **RGBA Value** | **Usage** |
|-----------|----------------|-----------|
| Glow Soft | rgba(0, 200, 232, 0.4) | Strong glow - active voice button |
| Glow Medium | rgba(0, 200, 232, 0.25) | Medium glow - hover states, focus |
| Glow Subtle | rgba(0, 200, 232, 0.12) | Subtle glow - card borders, ambient |

### Metallic Text Gradient (for Headings)

| **Position** | **Hex Code** | **Purpose** |
|--------------|--------------|-------------|
| 0% (Top) | #f0f0f5 | Highlight reflection |
| 20% | #c8c8d0 | Light band |
| 40% | #8a8a96 | Mid tone |
| 60% | #5a5a66 | Dark band |
| 80% | #8a8a96 | Mid tone |
| 100% (Bottom) | #c8c8d0 | Light band |

---

## 1.2 Typography System

### Font Families

| **Purpose** | **Font Family** | **Fallback** |
|-------------|-----------------|--------------|
| Headings | Orbitron | sans-serif |
| Body Text | Inter | system-ui, sans-serif |
| Code/Data | JetBrains Mono | monospace |

### Type Scale (Web)

| **Element** | **Font** | **Size** | **Weight** | **Line Height** |
|-------------|----------|----------|------------|-----------------|
| Page Title | Orbitron | 32px | 700 (Bold) | 1.2 |
| Section Header | Orbitron | 24px | 600 (Semi-Bold) | 1.3 |
| Card Title | Orbitron | 18px | 600 (Semi-Bold) | 1.4 |
| Body Text | Inter | 16px | 400 (Regular) | 1.5 |
| Small Text | Inter | 14px | 400 (Regular) | 1.5 |
| Caption/Meta | Inter | 12px | 400 (Regular) | 1.4 |
| Button Text | Inter | 14px | 600 (Semi-Bold) | 1.0 |
| Input Text | Inter | 16px | 400 (Regular) | 1.5 |

### Type Scale (Mobile)

| **Element** | **Font** | **Size** | **Weight** | **Line Height** |
|-------------|----------|----------|------------|-----------------|
| Page Title | Orbitron | 28px | 700 (Bold) | 1.2 |
| Section Header | Orbitron | 22px | 600 (Semi-Bold) | 1.3 |
| Card Title | Orbitron | 16px | 600 (Semi-Bold) | 1.4 |
| Body Text | Inter | 14px | 400 (Regular) | 1.5 |
| Small Text | Inter | 12px | 400 (Regular) | 1.5 |
| Caption/Meta | Inter | 10px | 400 (Regular) | 1.4 |

---

## 1.3 Spacing System

| **Token** | **Value** | **Usage** |
|-----------|-----------|-----------|
| xs | 4px | Tight gaps, icon padding |
| sm | 8px | Between related elements |
| md | 16px | Standard component padding |
| lg | 24px | Card padding, section gaps |
| xl | 32px | Large section padding |
| 2xl | 48px | Page margins |
| 3xl | 64px | Major section separators |

---

## 1.4 Border Radius

| **Token** | **Value** | **Usage** |
|-----------|-----------|-----------|
| sm | 4px | Small buttons, tags |
| md | 8px | Buttons, inputs |
| lg | 12px | Cards, containers |
| xl | 16px | Large cards, modals |
| full | 9999px | Pills, avatars, FAB |

---

## 1.5 Shadow System

| **Shadow Name** | **Specification** | **Usage** |
|-----------------|-------------------|-----------|
| Card Default | 0 4px 20px rgba(0,0,0,0.3) | Cards at rest |
| Card Hover | 0 8px 30px rgba(0,0,0,0.4) | Cards on hover |
| Glow Small | 0 0 15px Cyan at 12% | Subtle interactive glow |
| Glow Medium | 0 0 20px Cyan at 25% | Active elements |
| Glow Large | 0 0 30px Cyan at 40% | Voice button, emphasis |

---

## 1.6 Layout Grid

| **Property** | **Desktop** | **Tablet** | **Mobile** |
|--------------|-------------|------------|------------|
| Max Content Width | 1200px | 100% | 100% |
| Page Margin | 32px | 24px | 16px |
| Grid Columns | 12 | 8 | 4 |
| Column Gap | 24px | 16px | 12px |
| Sidebar Width | 320px | Collapsible | Hidden |

---

# 2. Web Application Screens

## 2.1 Screen: Command Center (Main Chat)

**Route:** / or /chat

### Page Layout

| **Property** | **Specification** |
|--------------|-------------------|
| Layout Type | Two-column: Chat area + Activity panel |
| Background | Deep Space (#0a0a0f) |
| Header Height | 64px, fixed position |
| Activity Panel | Right side, 320px width, collapsible |
| Chat Area | Flex grow, remaining space |
| Input Area | Bottom, 80px height, fixed |

### Header Section

| **Element** | **Specification** |
|-------------|-------------------|
| Logo | "ANGELINA" text, Orbitron 24px, metallic gradient |
| Logo Position | Left side, 24px padding |
| Navigation Items | Activity, Dashboard, Settings |
| Nav Item Style | Inter 14px medium, Text Secondary |
| Nav Active | Text Primary, cyan underline 2px with glow |
| Nav Hover | Text changes to Cyan Glow |
| Right Side | Notification bell + connection status dot |
| Status Dot | 8px circle, Success green when connected |

### Chat Messages Area

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Deep Space (#0a0a0f) |
| Padding | 24px all sides |
| Scroll Behavior | Vertical, auto-scroll to newest |
| Message Gap | 16px between messages |
| Max Bubble Width | 70% of container |

### Angelina Message (Left Aligned)

| **Property** | **Specification** |
|--------------|-------------------|
| Alignment | Left (flex-start) |
| Background | Charcoal (#141418) |
| Border | 1px solid Steel Dark |
| Border Radius | 16px 16px 16px 4px |
| Padding | 12px 16px |
| Avatar Position | Left of bubble |
| Avatar Size | 32px circle |
| Avatar Border | 2px solid Cyan at 30% |
| Avatar Glow | 0 0 10px Cyan at 20% |
| Text Color | Text Primary |
| Text Size | 16px, line-height 1.5 |
| Timestamp | Text Muted, 12px, right-aligned |

### User Message (Right Aligned)

| **Property** | **Specification** |
|--------------|-------------------|
| Alignment | Right (flex-end) |
| Background | Gradient: Gunmetal to Charcoal |
| Border | 1px solid Cyan at 20% |
| Border Radius | 16px 16px 4px 16px |
| Padding | 12px 16px |
| Avatar Position | Right of bubble |
| Text Color | Text Primary |
| Timestamp | Text Muted, 12px, right-aligned |

### Typing Indicator

| **Property** | **Specification** |
|--------------|-------------------|
| Container | Same as Angelina bubble |
| Dots | 3 circles, 8px each |
| Dot Color | Cyan Glow |
| Animation | Bounce up 4px, staggered 0.2s |
| Text | "Thinking..." in Text Secondary, italic |

### Voice Waveform (When Speaking)

| **Property** | **Specification** |
|--------------|-------------------|
| Display | When Angelina is speaking |
| Bars | 15-20 vertical bars, 3px wide |
| Bar Height | Animated 8px to 24px |
| Bar Color | Gradient: Cyan Glow to Cyan Teal |
| Animation | 0.5s loop, staggered timing |

### Input Area

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gradient fade: transparent to Deep Space |
| Border Top | 1px solid Steel Dark |
| Padding | 16px 24px 24px |
| Layout | Input wrapper + Voice FAB |

### Message Input Field

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal (#141418) |
| Border | 1px solid Steel Dark |
| Border Radius | 24px (pill shape) |
| Height | 48px |
| Padding | 12px 16px |
| Placeholder | "Type a message or speak..." |
| Placeholder Color | Text Muted |
| Focus Border | Cyan at 40% |
| Focus Glow | 0 0 15px Cyan at 15% |
| Attach Icon | Left inside, 20px, Text Muted |

### Voice FAB (Floating Action Button)

| **Property** | **Specification** |
|--------------|-------------------|
| Size | 64px × 64px |
| Position | Right of input, 12px gap |
| Background | Gunmetal (#1e1e24) |
| Border | 2px solid Cyan at 30% |
| Border Radius | 50% (circle) |
| Icon | Microphone, 24px, Cyan Glow |
| Default Glow | 0 0 20px Cyan at 25% |
| Hover Glow | 0 0 30px Cyan at 40% |

### Voice FAB States

| **State** | **Visual Change** |
|-----------|-------------------|
| Default | Subtle cyan glow always visible |
| Hover | Border brightens, glow intensifies |
| Listening | Pulsing glow animation 1.5s loop |
| Processing | Spinner replaces mic icon |

### Quick Actions Bar

| **Property** | **Specification** |
|--------------|-------------------|
| Position | Below input row |
| Layout | Horizontal row of pills |
| Gap | 8px between items |
| Scroll | Horizontal scroll on overflow |

### Quick Action Button

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gunmetal (#1e1e24) |
| Border | 1px solid Steel Dark |
| Border Radius | 20px (pill) |
| Padding | 6px 12px |
| Icon | 16px, left of text |
| Text | Inter 13px, Text Secondary |
| Hover Border | Cyan at 30% |
| Hover Text | Cyan Glow |
| Default Items | Check Email, Tasks, Calendar, Costs |

---

## 2.2 Screen: Activity Feed Panel

**Position:** Right side of Command Center, collapsible

### Panel Layout

| **Property** | **Specification** |
|--------------|-------------------|
| Width | 320px |
| Background | Deep Space (#0a0a0f) |
| Border Left | 1px solid Steel Dark |
| Position | Fixed right, full height minus header |
| Collapse | Toggle button or drag edge |

### Panel Header

| **Property** | **Specification** |
|--------------|-------------------|
| Height | 56px |
| Padding | 16px |
| Border Bottom | 1px solid Steel Dark |
| Title | "Activity Feed" Orbitron 16px |
| Close Button | X icon, 20px, right side |
| Filter | Dropdown below title, default "All" |

### Activity List

| **Property** | **Specification** |
|--------------|-------------------|
| Padding | 16px |
| Gap | 8px between items |
| Scroll | Vertical |
| Date Labels | "TODAY", "YESTERDAY" Text Muted 11px uppercase |

### Activity Item Card

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal (#141418) |
| Border | 1px solid Steel Dark |
| Border Left | 3px solid (varies by status) |
| Border Radius | 8px |
| Padding | 12px |
| Hover | Border changes to Steel Mid |

### Activity Status Colors

| **Status** | **Border Left Color** |
|------------|----------------------|
| Success/Completed | Success green (#00e88c) |
| Pending/Executing | Warning amber (#e8a800) |
| Failed | Error red (#e84040) |
| Info | Cyan Glow (#00c8e8) |

### Activity Item Content

| **Element** | **Specification** |
|-------------|-------------------|
| Icon | 16px, left of title, matches status color |
| Title | Inter 14px semibold, Text Primary |
| Detail | Inter 13px, Text Secondary, max 2 lines |
| Meta Row | Timestamp + Duration + Cost |
| Meta Style | Inter 12px, Text Muted |
| Retry Button | Cyan text link, appears on failed |

---

## 2.3 Screen: Dashboard

**Route:** /dashboard

### Page Layout

| **Property** | **Specification** |
|--------------|-------------------|
| Layout | Full width, single column |
| Background | Deep Space (#0a0a0f) |
| Padding | 32px |
| Max Width | 1200px centered |

### Page Header

| **Element** | **Specification** |
|-------------|-------------------|
| Title | "Dashboard" Orbitron 32px metallic |
| Right Side | Date range dropdown + Export button |
| Margin Bottom | 32px |

### Stats Grid

| **Property** | **Specification** |
|--------------|-------------------|
| Layout | 4 columns equal width |
| Gap | 16px |
| Mobile | 2 columns |

### Stat Card

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gradient: Gunmetal to Charcoal to Deep Space |
| Border | 1px solid Cyan at 15% |
| Border Radius | 12px |
| Padding | 20px |
| Top Glow Line | 1px cyan gradient, center 60% |
| Min Width | 180px |

### Stat Card Content

| **Element** | **Specification** |
|-------------|-------------------|
| Label | Text Muted, 12px uppercase, letter-spacing 1px |
| Value | Orbitron 32px bold, Text Primary |
| Change Indicator | 12px with arrow icon |
| Positive | Success green |
| Negative | Error red |

### Default Stat Cards

| **Position** | **Label** | **Example** |
|--------------|-----------|-------------|
| 1 | COMMANDS | 127 |
| 2 | COST TODAY | ₹342 |
| 3 | SUCCESS RATE | 94% |
| 4 | VOICE MINUTES | 45 min |

### Cost Chart Card

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Standard card style |
| Height | 280px total |
| Title | "Cost Breakdown (Last 7 Days)" Orbitron 16px |
| Chart Type | Bar chart |
| Bar Color | Cyan gradient |
| Grid Lines | Steel Dark, dashed |
| Axis Labels | Text Muted, 11px |
| Budget Line | Dashed warning color at threshold |

### Tool Usage Card

| **Property** | **Specification** |
|--------------|-------------------|
| Width | 50% desktop, 100% mobile |
| Title | "Tool Usage" |
| Bars | Horizontal progress bars |
| Track | Steel Dark |
| Fill | Cyan Glow |
| Labels | Tool name left, percentage right |

### Recent Memory Card

| **Property** | **Specification** |
|--------------|-------------------|
| Width | 50% desktop, 100% mobile |
| Title | "Recent Memory Items" |
| List | 4-5 memory snippets |
| Style | Bullet, Text Secondary, truncate 1 line |

---

## 2.4 Screen: Settings

**Route:** /settings

### Page Layout

| **Property** | **Specification** |
|--------------|-------------------|
| Layout | Two-column: Nav (240px) + Content |
| Background | Deep Space (#0a0a0f) |
| Mobile | Stack vertically |

### Settings Navigation

| **Property** | **Specification** |
|--------------|-------------------|
| Width | 240px |
| Background | Deep Space |
| Border Right | 1px solid Steel Dark |
| Padding | 24px 0 |

### Nav Item

| **Property** | **Specification** |
|--------------|-------------------|
| Height | 44px |
| Padding | 12px 24px |
| Icon | 20px, left side |
| Text | Inter 14px, Text Secondary |
| Active Background | Cyan at 10% |
| Active Text | Cyan Glow |
| Active Border Left | 3px solid Cyan Glow |
| Hover Background | Cyan at 5% |

### Settings Sections

| **Section** | **Contents** |
|-------------|--------------|
| Profile | Avatar, name, email, timezone |
| Integrations | Connected apps, add new |
| Voice | Enable voice, speed, language |
| Memory | View and manage memory items |
| Budget | Daily limit, alerts |
| Data | Export, delete account |
| About | Version, support links |

### Content Area

| **Property** | **Specification** |
|--------------|-------------------|
| Padding | 32px 48px |
| Section Title | Orbitron 20px, Text Primary |
| Section Gap | 32px between sections |

### Form Group

| **Property** | **Specification** |
|--------------|-------------------|
| Label | Inter 14px medium, Text Secondary |
| Label Gap | 8px below label |
| Input | Standard input component |
| Group Gap | 24px between groups |

### Toggle Row

| **Property** | **Specification** |
|--------------|-------------------|
| Layout | Space-between: label left, toggle right |
| Height | 56px |
| Border Bottom | 1px solid Steel Dark |
| Label | Inter 14px, Text Primary |
| Sublabel | Inter 12px, Text Muted |

---

## 2.5 Screen: Memory Management

**Route:** /memory

### Page Header

| **Element** | **Specification** |
|-------------|-------------------|
| Title | "Memory" Orbitron 32px |
| Actions | + Add Memory button, Search input |
| Filter Tabs | All, Preferences, Clients, Business, Personal |

### Filter Tabs

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Transparent |
| Active | Cyan underline, Text Primary |
| Inactive | Text Muted |
| Border | 1px solid Steel Dark below all |

### Memory Card

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal (#141418) |
| Border | 1px solid Steel Dark |
| Border Radius | 12px |
| Padding | 16px 20px |
| Margin Bottom | 12px |
| Hover Border | Cyan at 30% |

### Memory Card Content

| **Element** | **Specification** |
|-------------|-------------------|
| Tag Badge | Top left, uppercase 11px |
| More Menu | Three dots, top right, visible on hover |
| Content | Inter 15px, Text Primary |
| Meta Row | Created, Access count, Last accessed |
| Meta Style | Inter 12px, Text Muted |

### Memory Tag Colors

| **Tag** | **Color** |
|---------|-----------|
| Preference | Cyan Glow |
| Business | Warning amber |
| Client | Success green |
| Personal | Purple (#c88ce8) |

---

## 2.6 Screen: Integrations

**Route:** /integrations

### Page Layout

| **Property** | **Specification** |
|--------------|-------------------|
| Title | "Integrations" |
| Sections | Connected (count), Available (count) |
| Layout | Grid of cards |

### Integration Grid

| **Property** | **Specification** |
|--------------|-------------------|
| Columns | 3 desktop, 2 tablet, 1 mobile |
| Gap | 16px |
| Card Min Width | 280px |

### Integration Card

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gradient: Gunmetal to Charcoal |
| Border | 1px solid Steel Dark |
| Border Radius | 12px |
| Padding | 20px |
| Hover Border | Cyan at 30% |
| Hover Glow | 0 0 20px Cyan at 10% |

### Integration Card (Connected)

| **Property** | **Specification** |
|--------------|-------------------|
| Border | Success green at 30% |
| Status | "✓ Connected" in Success green |
| Actions | Disconnect, Settings buttons |

### Integration Card Content

| **Element** | **Specification** |
|-------------|-------------------|
| Icon | 48px, tool logo |
| Name | Inter 18px semibold, Text Primary |
| Status | 13px with checkmark |
| Description | Inter 13px, Text Secondary |
| Actions | Bottom row, secondary buttons |

---

# 3. Android Mobile Screens

## 3.1 Global Mobile Layout

### Status Bar

| **Property** | **Specification** |
|--------------|-------------------|
| Style | Light content (white icons) |
| Background | Transparent, blends with app |

### Bottom Navigation

| **Property** | **Specification** |
|--------------|-------------------|
| Height | 60px + safe area bottom |
| Background | Charcoal (#141418) |
| Border Top | 1px solid Steel Dark |
| Items | 4: Chat, Activity, Dashboard, Settings |
| Icon Size | 24px |
| Label Size | 10px |
| Inactive Color | Text Muted |
| Active Color | Cyan Glow |
| Active Indicator | 2px underline with glow |

### Safe Areas

| **Property** | **Specification** |
|--------------|-------------------|
| Top | Respect status bar height |
| Bottom | Respect home indicator |
| Notch | Respect cutout areas |

---

## 3.2 Screen: Chat (Home Tab)

### Screen Header

| **Property** | **Specification** |
|--------------|-------------------|
| Height | 56dp |
| Background | Charcoal (#141418) |
| Border Bottom | 1px solid Steel Dark |
| Title | "ANGELINA" Orbitron 20px, left |
| Right Icons | Settings gear + status dot |
| Status Dot | 8px, Success green |

### Message List

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Deep Space |
| Padding | 16dp |
| Message Gap | 12dp |
| Max Bubble Width | 80% of screen |

### Message Bubbles (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Text Size | 15sp |
| Padding | 12dp |
| Avatar Size | 28dp |
| Timestamp Size | 11sp |
| Border Radius | Same as web |

### Input Area (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Deep Space with gradient |
| Padding | 12dp |
| Border Top | 1px solid Steel Dark |

### Text Input (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal |
| Border | 1px solid Steel Dark |
| Border Radius | 24dp (pill) |
| Height | 44dp |
| Padding | 12dp 16dp |

### Voice FAB (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Size | 56dp × 56dp |
| Position | Right of input |
| Background | Gunmetal |
| Border | 2px solid Cyan at 30% |
| Icon | Microphone, 24dp, Cyan Glow |
| Elevation | 8dp |
| Glow | Cyan shadow |

### Quick Actions (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Layout | Horizontal scroll |
| Position | Below input |
| Pill Height | 32dp |
| Pill Padding | 8dp 12dp |
| Gap | 8dp |

---

## 3.3 Screen: Activity Tab

### Header

| **Property** | **Specification** |
|--------------|-------------------|
| Title | "Activity" left aligned |
| Search Icon | Right side |
| Filter | Dropdown or chips below |

### Activity List (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Deep Space |
| Padding | 16dp |
| Item Gap | 8dp |

### Activity Card (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Same as web panel cards |
| Touch Feedback | Ripple with subtle glow |

### Pull to Refresh

| **Property** | **Specification** |
|--------------|-------------------|
| Indicator | Cyan Glow spinner |
| Background | Deep Space |

---

## 3.4 Screen: Dashboard Tab

### Header

| **Property** | **Specification** |
|--------------|-------------------|
| Title | "Dashboard" |
| Right | Date filter dropdown |

### Stats Grid (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Columns | 2 |
| Gap | 12dp |
| Padding | 16dp |

### Stat Card (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Width | 50% minus gap |
| Padding | 16dp |
| Value Size | Orbitron 28sp |
| Label Size | 11sp |

### Charts (Mobile)

| **Property** | **Specification** |
|--------------|-------------------|
| Chart Height | 120dp |
| Scroll | Vertical for dashboard |

---

## 3.5 Screen: Settings Tab

### Header

| **Property** | **Specification** |
|--------------|-------------------|
| Title | "Settings" |
| No additional icons |

### Profile Card

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal |
| Padding | 16dp |
| Avatar | 56dp circle with cyan glow |
| Name | Inter 18sp semibold |
| Email | Inter 14sp, Text Secondary |
| Edit | "Edit >" on right |

### Settings Sections

| **Property** | **Specification** |
|--------------|-------------------|
| Section Header | Text Muted, 11sp uppercase |
| Section Background | Charcoal card |
| Row Height | 56dp |
| Row Border | Bottom 1px Steel Dark |
| Chevron | Right side for nav rows |
| Toggle | Right side for toggle rows |

---

## 3.6 Home Screen Widget (2×2)

### Widget Layout

| **Property** | **Specification** |
|--------------|-------------------|
| Size | 2×2 grid cells (~110dp × 110dp) |
| Background | Charcoal (#141418) |
| Border | 1px solid Cyan at 20% |
| Border Radius | 16dp |
| Padding | 12dp |

### Widget Content

| **Element** | **Specification** |
|-------------|-------------------|
| Header | "ANGELINA" Orbitron 12sp |
| Divider | 1px line, Steel Dark |
| Center | Microphone icon 32dp with cyan glow |
| Footer | "Tap to speak" Text Muted 10sp |

### Widget States

| **State** | **Visual** |
|-----------|------------|
| Default | Static mic with subtle glow |
| Listening | Pulsing glow animation |
| Processing | Spinner replaces mic |
| Success | Checkmark briefly, then default |

---

## 3.7 Push Notification Design

### Notification Layout

| **Element** | **Specification** |
|-------------|-------------------|
| Icon | Angelina logo, 24dp |
| Title | Bold, action completed |
| Body | Details of action |
| Timestamp | System handled |

### Notification Actions

| **Type** | **Buttons** |
|----------|-------------|
| Task Completed | View, Undo |
| Email Sent | View Email |
| Error | Retry, Dismiss |
| Reminder | Snooze, Complete |

---

# 4. Component Library

## 4.1 Primary Button

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gradient: Steel Mid to Gunmetal |
| Border | 1px solid Cyan at 20% |
| Border Radius | 8px |
| Height | 40px (web), 44dp (mobile) |
| Padding | 12px 24px |
| Font | Inter 14px semibold |
| Text Color | Text Primary |
| Hover | Border brightens, glow appears |
| Active | Darker gradient, inset shadow |
| Disabled | Opacity 0.5 |
| Transition | 150ms ease |

## 4.2 Secondary Button

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Transparent |
| Border | 1px solid Cyan at 30% |
| Border Radius | 8px |
| Height | 40px |
| Font | Inter 14px medium |
| Text Color | Cyan Glow |
| Hover | Background Cyan at 10%, border brightens |
| Active | Background Cyan at 15% |
| Transition | 150ms ease |

## 4.3 Ghost Button

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Transparent |
| Border | 1px solid Steel Dark |
| Border Radius | 8px |
| Font | Inter 14px |
| Text Color | Text Secondary |
| Hover | Border Steel Mid, text Text Primary |
| Transition | 150ms ease |

## 4.4 Card Component

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gradient: Gunmetal to Charcoal to Deep Space |
| Border | 1px solid Cyan at 15% |
| Border Radius | 12px |
| Padding | 24px (web), 16dp (mobile) |
| Top Glow Line | 1px, center 60%, Cyan at 50% |
| Outer Glow | 0 0 15px Cyan at 8% |
| Hover Border | Cyan at 30% |
| Hover Glow | 0 0 20px Cyan at 15% |
| Transition | 200ms ease |

## 4.5 Input Field

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal (#141418) |
| Border | 1px solid Steel Dark |
| Border Radius | 8px |
| Height | 44px |
| Padding | 12px 16px |
| Font | Inter 16px |
| Text Color | Text Primary |
| Placeholder | Text Muted |
| Focus Border | Cyan at 40% |
| Focus Glow | 0 0 15px Cyan at 15% |
| Error Border | Error red |
| Label | Above, 8px gap, Inter 14px medium |
| Transition | 200ms ease |

### Input States

| **State** | **Border** | **Background** | **Label** |
|-----------|------------|----------------|-----------|
| Default | Steel Dark | Charcoal | Text Secondary |
| Hover | Steel Mid | Charcoal | Text Secondary |
| Focus | Cyan at 40% | Charcoal | Cyan Glow |
| Error | Error red | Charcoal | Error red |
| Disabled | Steel Dark | Deep Space | Text Muted |

## 4.6 Toggle Switch

| **Property** | **Specification** |
|--------------|-------------------|
| Track Size | 48px × 24px |
| Track Off | Steel Dark |
| Track On | Cyan at 30% |
| Track Radius | 12px |
| Thumb Size | 20px × 20px |
| Thumb Off | Steel Light, left position |
| Thumb On | Cyan Glow, right position |
| Thumb Glow On | 0 0 10px Cyan at 50% |
| Transition | 300ms ease |

## 4.7 Status Badge

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Gradient: Steel Dark to Gunmetal |
| Border | 1px solid (status color at 30%) |
| Border Radius | 16px (pill) |
| Padding | 4px 12px |
| Height | 24px |
| Dot | 8px circle, left side |
| Text | 12px medium |

### Badge Variants

| **Status** | **Color** | **Dot Animation** |
|------------|-----------|-------------------|
| Thinking | Cyan Glow | Pulse |
| Executing | Warning | Pulse |
| Completed | Success | None |
| Failed | Error | None |
| Waiting | Text Muted | None |

## 4.8 Avatar with Glow Ring

| **Property** | **Specification** |
|--------------|-------------------|
| Sizes | 24px, 32px, 40px, 56px, 80px |
| Shape | Circle |
| Background | Gunmetal |
| Border | 2px solid Cyan at 30% |
| Glow | 0 0 10px Cyan at 20% |
| Fallback | First letter of name, centered |

### Avatar States

| **State** | **Change** |
|-----------|------------|
| Default | Subtle glow |
| Active/Speaking | Enhanced glow, pulse optional |
| Offline | Border gray, no glow |

## 4.9 Progress Bar

### Linear Progress

| **Property** | **Specification** |
|--------------|-------------------|
| Track Height | 8px |
| Track Background | Steel Dark |
| Track Radius | 4px |
| Fill | Cyan Glow |
| Fill Radius | 4px |

### Circular Spinner

| **Property** | **Specification** |
|--------------|-------------------|
| Sizes | 16px, 24px, 40px |
| Stroke | 2px (small), 3px (medium/large) |
| Color | Cyan Glow |
| Animation | Rotate 360deg, 1s linear loop |
| Arc | 270deg partial circle |

## 4.10 Toast Notification

| **Property** | **Specification** |
|--------------|-------------------|
| Position | Bottom center, 24px from edge |
| Background | Charcoal |
| Border | 1px solid Steel Dark |
| Border Left | 4px solid (status color) |
| Border Radius | 8px |
| Padding | 12px 16px |
| Max Width | 400px |
| Icon | 20px, status color |
| Message | Inter 14px, Text Primary |
| Action | Cyan text link |
| Auto Dismiss | 4 seconds |

## 4.11 Modal Dialog

### Overlay

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Deep Space at 80% opacity |
| Blur | 4px backdrop blur optional |

### Modal Container

| **Property** | **Specification** |
|--------------|-------------------|
| Background | Charcoal |
| Border | 1px solid Steel Dark |
| Border Radius | 16px |
| Max Width | 480px (S), 640px (M), 800px (L) |
| Padding | 24px |
| Shadow | 0 8px 40px black at 50% |

### Modal Header

| **Element** | **Specification** |
|-------------|-------------------|
| Title | Orbitron 20px, Text Primary |
| Close | X icon 24px, top right |
| Border | Optional 1px Steel Dark bottom |

### Modal Footer

| **Property** | **Specification** |
|--------------|-------------------|
| Border Top | 1px solid Steel Dark |
| Padding Top | 16px |
| Buttons | Right aligned, 12px gap |

---

# 5. Interaction & Animation Specs

## 5.1 Animation Durations

| **Token** | **Duration** | **Usage** |
|-----------|--------------|-----------|
| Fast | 150ms | Hovers, toggles, small interactions |
| Normal | 250ms | Standard transitions |
| Slow | 400ms | Page transitions, modals |
| Glow Pulse | 1500ms | Voice button listening state |

## 5.2 Animation Easings

| **Name** | **Usage** |
|----------|-----------|
| Ease Out | Most transitions |
| Ease In Out | Modals, page changes |
| Bounce | Playful interactions |

## 5.3 Voice Waveform

| **Property** | **Specification** |
|--------------|-------------------|
| Bars | 15-20 total |
| Width | 3px per bar |
| Gap | 2px between |
| Min Height | 8px |
| Max Height | 24px |
| Animation | 500ms loop, staggered 50ms |
| Color | Cyan gradient |

## 5.4 Typing Indicator

| **Property** | **Specification** |
|--------------|-------------------|
| Dots | 3 total |
| Size | 8px each |
| Gap | 4px |
| Animation | Bounce up 4px |
| Duration | 1.4s infinite |
| Stagger | 0.2s between dots |
| Color | Cyan Glow |

## 5.5 Glow Pulse (Voice FAB)

| **Keyframe** | **Glow** |
|--------------|----------|
| 0% | 0 0 20px Cyan at 25% |
| 50% | 0 0 40px Cyan at 50% |
| 100% | 0 0 20px Cyan at 25% |
| Duration | 1.5s infinite |
| Easing | Ease in out |

## 5.6 Skeleton Loading

| **Property** | **Specification** |
|--------------|-------------------|
| Base Color | Steel Dark |
| Highlight | Steel Mid |
| Animation | Shimmer left to right |
| Duration | 1.5s infinite |
| Radius | Match content shape |

## 5.7 Transition Specs

| **Element** | **Duration** | **Property** |
|-------------|--------------|--------------|
| Button Hover | 150ms | Border, glow |
| Card Hover | 200ms | Border, shadow |
| Input Focus | 200ms | Border, glow |
| Toggle | 300ms | Thumb position, color |
| Modal Open | 250ms | Scale, opacity |
| Modal Close | 200ms | Scale, opacity |
| Page Change | 250ms | Opacity, translate |
| Activity Enter | 300ms | Slide, opacity |
| Toast Enter | 300ms | Slide up, opacity |
| Toast Exit | 200ms | Opacity |

---

# 6. Responsive Guidelines

## 6.1 Breakpoints

| **Name** | **Width** | **Columns** | **Sidebar** | **Changes** |
|----------|-----------|-------------|-------------|-------------|
| Mobile | < 640px | 4 | Hidden | Stack, bottom nav |
| Tablet | 640-1024px | 8 | Collapsible | Two-column |
| Desktop | 1024-1440px | 12 | Visible 320px | Full layout |
| Large | > 1440px | 12 | Visible | Max container |

## 6.2 Mobile Adaptations

| **Element** | **Change** |
|-------------|------------|
| Header | Simplified, hamburger if needed |
| Activity Panel | Becomes separate tab |
| Quick Actions | Horizontal scroll |
| Dashboard Stats | 2-column grid |
| Settings Nav | Accordion or scroll |
| Modals | Full screen on small |
| Inputs | Full width |
| Buttons | Full width in forms |

## 6.3 Touch Targets

| **Property** | **Specification** |
|--------------|-------------------|
| Minimum Size | 44px × 44px |
| Spacing | 8px minimum between |
| Buttons | Full width in forms |
| Links | Underline, good line height |

---

# 7. Implementation Notes

## 7.1 Technology Stack

| **Category** | **Recommendation** |
|--------------|-------------------|
| Web Framework | Next.js 14 |
| Mobile | React Native + Expo |
| Components | Shadcn/ui |
| Styling | Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form |
| Charts | Recharts (web), Victory (mobile) |
| Icons | Lucide |
| Animation | Framer Motion |
| Fonts | Google Fonts |

## 7.2 Design Handoff Checklist

- All screens with full specifications
- Design tokens documented
- Component states covered
- Responsive variants defined
- Animations specified
- Mobile adaptations noted
- Touch targets verified
- Accessibility considered

## 7.3 Implementation Priority

| **Phase** | **Deliverables** |
|-----------|------------------|
| Phase 1 | Design tokens, core components |
| Phase 2 | Command Center, Voice FAB |
| Phase 3 | Activity Feed |
| Phase 4 | Dashboard |
| Phase 5 | Settings, Memory, Integrations |
| Phase 6 | Android screens |
| Phase 7 | Widget, notifications |

## 7.4 Asset Requirements

| **Type** | **Format** | **Notes** |
|----------|------------|-----------|
| Icons | SVG | Lucide set |
| Logo | SVG | Scalable |
| Fonts | WOFF2, OTF | Orbitron, Inter |
| App Icon | PNG | Multiple sizes |

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This document provides the complete blueprint for designing all screens of ANGELINA AI. Each specification includes layout, components, states, and interactions.

**Reference:** DESIGN-SYSTEM.md for complete color values

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Document prepared for AI With Dhruv | February 2026*

*"Turning AI into Outcomes"*
