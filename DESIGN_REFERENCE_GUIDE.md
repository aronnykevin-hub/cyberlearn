# 🎨 Visual Design Reference & Quick Start Guide

## 🎯 Quick Overview

### What Changed
```
LANDING PAGE:
Before: Basic "Get Started" button in nav bar only
After:  Floating "Get Started" button in top-right corner (appears on scroll)

CREATE COMPANY:
Before: Modal dialog - Create button cut off on mobile 😞
After:  Full-page scrollable form - Perfect on all devices! 🎉
```

---

## 📱 Mobile Screenshots (Text Representation)

### Landing Page - Before User Scrolls
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🌙             Cyberlearn  [Get] ┃ ← Get Started in nav only
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                  ┃
┃   🔒 Secure Your Organization   ┃
┃                                  ┃
┃   Empower your employees...      ┃
┃                                  ┃
┃   [Start Free Trial] [Watch]     ┃
┃                                  ┃
┃   ← Hero section content →       ┃
┃                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Landing Page - After User Scrolls (300px)
```
┏━━━━━━━━━━━━━━━━━━━━━ ✨ Get 🚀 ┓ ← NEW! Floating button appears
┃                                  ┃
┃   [Features Section]             ┃
┃                                  ┃
┃   📚 Smart Learning Modules      ┃
┃   🔔 Phishing Simulations        ┃
┃   🛡️  Threat Reporting           ┃
┃                                  ┃
┃   ← Features cards →             ┃
┃                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Create Company - Step 1
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏢 Create Your Company  [←]      ┃ ← Sticky header
┃ Set up your organization...      ┃
┃ ████░░░░░░░░ 50%  Step 1/2       ┃ ← Progress bar
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                  ┃
┃ Company Information              ┃
┃ Tell us about organization       ┃
┃                                  ┃
┃ Company Name *                   ┃
┃ ┌────────────────────────────┐   ┃
┃ │ [Enter company name] ✓    │   ┃ ← Green checkmark
┃ └────────────────────────────┘   ┃
┃                                  ┃
┃ ┌─ Industry * ──┬─ Country * ┐  ┃
┃ │ [Technology]  │ [United..] │  ┃
┃ └───────────────┴────────────┘  ┃
┃                                  ┃
┃ ↓ (Scroll to see more)           ┃
┃                                  ┃
┃                      [Next ➜]     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Create Company - Step 2
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏢 Create Your Company  [←]      ┃ ← Sticky header
┃ Set up your organization...      ┃
┃ ██████████████████ 100% Step 2/2 ┃ ← Progress at 100%
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                  ┃
┃ Departments & Location           ┃
┃ Add address and initial depts    ┃
┃                                  ┃
┃ Company Address *                ┃
┃ ┌────────────────────────────┐   ┃
┃ │ 123 Main St                │   ┃
┃ │ New York, NY 10001    ✓    │   ┃
┃ └────────────────────────────┘   ┃
┃                                  ┃
┃ Initial Departments * (8 config) ┃
┃ ┌────────────────────────────┐   ┃
┃ │ IT / Cybersecurity         │   ┃
┃ │ Finance                    │   ┃
┃ │ Customer Care              │   ┃
┃ │ Human Resources (HR)       │   ┃
┃ │ Marketing                  │   ┃
┃ │ Operations                 │   ┃
┃ │ Sales                      │   ┃
┃ │ Administration        ↓    │   ┃
┃ └────────────────────────────┘   ┃
┃                                  ┃
┃ [← Back]    [✓ Create Company]   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎨 Color Palette

### Primary Colors
```
Blue-600:    #2563eb  (Main action buttons)
Cyan-500:    #06b6d4  (Gradient accent)
Slate-900:   #0f172a  (Dark mode text)
White:       #ffffff  (Light mode background)
```

### Semantic Colors
```
Success:     #16a34a  (Green - checkmarks, success)
Error:       #ef4444  (Red - validation errors)
Warning:     #f59e0b  (Amber - informational)
Neutral:     #64748b  (Slate - secondary text)
```

### Gradients
```
Primary:     from-blue-600 to-cyan-500
Success:     from-green-600 to-emerald-500
Error:       from-red-600 to-rose-500
```

---

## 🎬 Animation Guide

### Floating Button Animation
```
State 1: Hidden (initial)
- opacity: 0
- scale: 0.75
- pointer-events: none

State 2: Visible (on scroll > 300px)
- opacity: 1
- scale: 1
- Duration: 300ms ease-out

State 3: Hover
- scale: 1.1
- shadow: increased
- Duration: 200ms ease-out

State 4: Clicked
- scale: 0.95
- Duration: 100ms ease-in (tactile feedback)
```

### Form Step Animation
```
Entering new step:
- Initial: opacity: 0, translateY: 20px
- Final: opacity: 1, translateY: 0
- Duration: 300ms ease-out

Checkmark Animation:
- Initial: scale: 0, opacity: 0
- Final: scale: 1, opacity: 1
- Duration: 200ms ease-out

Error Message:
- Initial: max-height: 0, opacity: 0
- Final: max-height: 100px, opacity: 1
- Duration: 200ms ease-out
```

---

## 📐 Spacing & Layout

### Form Layout (Mobile)
```
Total width: 100% of viewport
Horizontal padding: 16px (both sides)
Available content width: 100% - 32px

Max-width breakpoint:
- Mobile: Full width
- Tablet+: 640px max
- Desktop: 896px max (centered)
```

### Input Fields
```
Height: 48px (mobile), 56px (desktop)
Padding: 12px 16px (horizontal), 8px 12px (vertical)
Border radius: 12px
Border width: 2px
Focus ring: 4px blue-500/30
```

### Form Sections
```
Top section margin: 24px
Between elements: 16px
Section heading margin-bottom: 8px
Label to input: 8px
Input to helper text: 4px
```

---

## 📱 Responsive Breakpoints

### Tailwind Breakpoints Used
```
sm (640px):   Small tablets, large phones
md (768px):   Tablets
lg (1024px):  Desktops
```

### Component Breakpoint Changes
```
Mobile (< 640px):
✓ Single column form
✓ Full-width inputs
✓ Stacked buttons
✓ Icon-only labels

Tablet (640px - 1024px):
✓ Optimized spacing
✓ Increased padding
✓ Better typography

Desktop (> 1024px):
✓ Centered max-width
✓ Multi-column where applicable
✓ Comfortable reading width
✓ Full labels
```

---

## 🎯 Interactive Elements

### Buttons
```
Resting State:
- Background: gradient
- Text: white
- Shadow: none
- Scale: 1

Hover State:
- Shadow: large (0 20px 25px)
- Scale: 1.05
- Cursor: pointer

Active/Click State:
- Scale: 0.95
- Shadow: reduced

Disabled State:
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects
```

### Input Fields
```
Idle State:
- Border: 2px slate-200 (light), slate-700 (dark)
- Background: white/slate-800
- Shadow: none

Focus State:
- Border: 2px blue-500
- Ring: 4px blue-500/30
- Background: white/slate-800

Error State:
- Border: 2px red-500
- Ring: 4px red-500/30
- Text color: red-600

Success State:
- Border: 2px green-200 (light), green-800 (dark)
- Icon: green checkmark (right side)
```

---

## 🌙 Dark Mode

### Colors Inverse in Dark Mode
```
Light Mode → Dark Mode
White → Slate-900
Slate-50 → Slate-800
Slate-200 → Slate-700
Text-900 → Text-white
Text-600 → Text-slate-300

Gradient: Maintained (appears darker)
Icons: Inverted colors
Shadows: Reduced opacity in dark
```

---

## ♿ Accessibility Features

### Labels & ARIA
```
<label for="company-name">
  Company Name <span class="text-red-500">*</span>
</label>
<input id="company-name" type="text" />

Error message:
<p id="name-error" role="alert" class="text-red-500">
  Company name is required
</p>
```

### Keyboard Navigation
```
Tab: Move between fields
Shift+Tab: Move backward
Enter: Submit form / Next button
Escape: Close/Cancel (optional)

Focus visible: Blue ring (4px)
```

### Screen Reader
```
Progress bar: <div role="progressbar" aria-valuenow="50" ... />
Form steps: Announced via aria-label
Errors: Announced via role="alert"
Success: Announced via toast
```

---

## 🔤 Typography

### Font Stack
```
Headings: 'DM Sans', 'Inter', sans-serif
Body: 'Inter', sans-serif
Mono: 'Monaco', 'Courier', monospace
```

### Text Sizes
```
Heading 1 (H1): 32px desktop, 24px mobile (bold)
Heading 2 (H2): 28px desktop, 20px mobile (bold)
Heading 3 (H3): 24px desktop, 18px mobile (semibold)
Body: 18px desktop, 16px mobile (regular)
Small: 14px (regular)
Tiny: 12px (regular)
Label: 14px (semibold)
```

### Line Height
```
Headings: 1.2
Body: 1.6
Dense: 1.4
```

---

## 📊 Component Size Reference

### Heights
```
Input fields: 48px (mobile), 56px (desktop)
Buttons: 44px (mobile), 48px (desktop)
Icon buttons: 40px square
Header: 60px (sticky)
Navigation: 64px (desktop)
```

### Widths
```
Form max-width: 896px
Desktop sidebar: 280px
Mobile nav: 100%
Button min-width: 120px
Icon: 16px, 20px, 24px, 32px
```

---

## 🎪 Example: Creating a Similar Form

```tsx
// Pattern to follow for new forms:
1. Sticky header with progress
2. Scrollable content area
3. Large input fields (48px+)
4. Real-time validation
5. Step-by-step progression
6. Clear error messages
7. Loading states
8. Success feedback

// Key CSS classes:
- sticky top-0 z-40 (header)
- max-w-2xl mx-auto (centered)
- space-y-6 (element spacing)
- rounded-xl (borders)
- focus:ring-2 focus:ring-blue-500 (inputs)
```

---

## ✨ Best Practices Applied

### Mobile-First Design
✓ Start with mobile constraints  
✓ Scale up for larger screens  
✓ Touch-friendly targets (48px+)  
✓ Readable text (16px+)  

### Performance
✓ CSS animations use GPU (transform, opacity)  
✓ No layout shifts  
✓ Minimal re-renders  
✓ Smooth 60fps animations  

### Accessibility
✓ Proper semantic HTML  
✓ ARIA labels where needed  
✓ Keyboard navigation  
✓ Screen reader compatible  

### User Experience
✓ Clear error messages  
✓ Visual feedback  
✓ Progress indication  
✓ Confirmation flows  

---

## 🚀 Quick Copy-Paste: Key CSS Classes

```html
<!-- Sticky Header -->
<div class="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">

<!-- Form Container -->
<form class="max-w-2xl mx-auto px-4 py-8 space-y-6">

<!-- Input Field -->
<input class="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30">

<!-- Button -->
<button class="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all">

<!-- Progress Bar -->
<div class="h-2 bg-slate-200 rounded-full overflow-hidden">
  <div class="h-full bg-gradient-to-r from-blue-600 to-cyan-500" style="width: 50%"></div>
</div>

<!-- Floating Button -->
<button class="fixed right-4 top-4 sm:right-6 sm:top-6 z-40 scale-100 opacity-100 shadow-2xl">

<!-- Error Message -->
<p class="flex items-center gap-2 text-sm text-red-500 mt-1">
  <AlertCircle className="w-4 h-4" /> Error message
</p>
```

---

## 📚 Design System Files

| Asset | Location |
|-------|----------|
| Components | `frontend/src/components/` |
| Styles | `frontend/src/index.css` + Tailwind |
| Icons | lucide-react library |
| Fonts | Inter, DM Sans (Tailwind defaults) |
| Colors | Tailwind color palette |

---

## 🎓 Design Patterns Used

1. **Progressive Disclosure**: Step-by-step form (reveal next step when current valid)
2. **Real-time Validation**: Feedback as user types
3. **Visual Hierarchy**: Size, color, weight for importance
4. **Accessibility**: ARIA labels, semantic HTML
5. **Responsive**: Mobile-first approach with breakpoints
6. **Animation**: Smooth, purposeful animations (not distracting)
7. **Consistency**: Repeated patterns for familiar feel

---

**Version**: 1.0  
**Last Updated**: April 28, 2026  
**Status**: ✅ Complete
