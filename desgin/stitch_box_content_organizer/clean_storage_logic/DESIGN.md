---
name: Clean Storage Logic
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3d4a3d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#6c7b6c'
  outline-variant: '#bbcbba'
  surface-tint: '#006d33'
  primary: '#006d33'
  on-primary: '#ffffff'
  primary-container: '#07c160'
  on-primary-container: '#00471f'
  inverse-primary: '#45e17c'
  secondary: '#0058bc'
  on-secondary: '#ffffff'
  secondary-container: '#0070eb'
  on-secondary-container: '#fefcff'
  tertiary: '#8c5000'
  on-tertiary: '#ffffff'
  tertiary-container: '#f58f00'
  on-tertiary-container: '#5d3300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#66ff95'
  primary-fixed-dim: '#45e17c'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005225'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffdcbf'
  tertiary-fixed-dim: '#ffb874'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6a3b00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 12px
  margin: 16px
---

## Brand & Style

The design system is built for high-utility personal organization. It prioritizes clarity, efficiency, and a sense of calm order. The target audience includes individuals managing home inventory, collectors, and small business owners who require a reliable digital twin of their physical storage.

The visual style is **Corporate / Modern** with a focus on functional minimalism. It leverages high-quality whitespace and a structured card-based layout to reduce cognitive load. The emotional response is one of reliability and "controlled transparency"—users should feel that their belongings are securely tracked and easily accessible. The interface follows the "utility-first" principle, ensuring that the tool feels like a natural extension of the WeChat ecosystem while providing a more refined, premium organization experience.

## Colors

The palette is anchored in a sense of familiarity and trust. 

- **Primary**: A vibrant WeChat Green (#07C160) used for primary actions, success states, and brand presence.
- **Secondary**: A deep "Logic Blue" (#007AFF) used for secondary identifiers and organizational links.
- **Background**: A soft, neutral grey (#F7F7F7) provides a low-contrast canvas that reduces eye strain during long inventory sessions.
- **Surface**: Pure White (#FFFFFF) is reserved for interactive cards and input containers to create clear separation from the background.
- **Accent**: A warm Orange (#FF9500) is used sparingly for alerts or "low stock" indicators to provide immediate visual hierarchy.

## Typography

This design system utilizes a dual-font strategy to balance character with utility. **Plus Jakarta Sans** is used for headlines to provide a modern, welcoming, and open feel. **Be Vietnam Pro** is used for all functional text, body copy, and labels due to its exceptional legibility at small scales.

For the WeChat Mini Program environment, the system should fall back to **PingFang SC** for Chinese characters while maintaining the specified sans-serif fonts for Latin alphanumeric characters. This ensures a seamless "Native" feel for domestic users while retaining a distinct design identity. Use `label-sm` in all-caps for metadata like "LAST UPDATED" to create an editorial distinction.

## Layout & Spacing

The layout follows a **fluid grid** model tailored for mobile viewports. It utilizes a 16px margin on the left and right edges of the screen to ensure content never touches the bezel.

The spacing rhythm is based on a 4px baseline grid. 
- **Cards** should use 12px or 16px internal padding.
- **Vertical spacing** between cards in a list should be a consistent 12px (`gutter`).
- **Grouped sections** should be separated by 24px or 32px to denote a change in information category.

When displaying item grids within a box, use a 2-column or 3-column layout with a 12px gutter between elements to maximize information density without feeling cluttered.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Background)**: #F7F7F7. The base floor of the application.
- **Level 1 (Cards/Surfaces)**: #FFFFFF. These elements sit slightly above the background. They use a very soft, diffused shadow: `0 4px 12px rgba(0, 0, 0, 0.05)`.
- **Level 2 (Active Elements/Modals)**: Elements that require immediate attention or hover states use a more pronounced shadow: `0 8px 24px rgba(0, 0, 0, 0.08)`.

Avoid harsh borders. Instead, use thin 1px strokes in a light grey (#EDEDED) only when a card is placed on another white surface.

## Shapes

The shape language is consistently **Rounded**. 

- **Primary Cards**: Use a 16px corner radius (`rounded-xl` contextually) to evoke a friendly, modern feel.
- **Buttons and Inputs**: Use a 12px corner radius (`rounded-lg`) to maintain a cohesive look with the cards while appearing slightly more "contained."
- **Small Badges/Chips**: Use 8px or a full pill-shape for category tags to distinguish them from functional UI components.

Consistent rounding across all components is critical to maintaining the "soft and calming" visual narrative.

## Components

### Storage Cards
The hero component of the system. Cards feature a white surface, 16px corner radius, and a soft shadow. The layout inside includes a bold title (`headline-sm`), a location subtitle with a map-pin icon (`label-md`), and a footer showing the item count and update time in `label-sm`.

### Action Buttons
- **Primary Add Button**: A floating action button (FAB) or high-visibility fixed button at the bottom of the screen. It uses the Primary Green background with white text and a 12px radius.
- **Secondary Buttons**: Outlined with a 1px stroke in Primary Green or Blue.

### Lists & Form Fields
- **Item Lists**: Use clean rows with 48px square thumbnails with a 8px corner radius. Each row is separated by a 0.5px hairline divider.
- **Form Inputs**: Labels sit above the input field in `label-md` (Medium weight). Inputs have a #F7F7F7 background to differentiate them from the primary card surface, with 12px padding.

### Navigation & TabBar
- **NavBar**: Minimalist white background with centered title. Use the standard WeChat "capsule" menu for consistency.
- **TabBar**: A 56px high bar with a top-border hairline. Icons are outline style (2px stroke weight). The active state is indicated by the Primary Green color.