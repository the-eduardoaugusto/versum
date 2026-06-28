# Profile — Native-Feel Redesign

**Date:** 2026-06-28  
**Scope:** `apps/client/src/features/profile/`  
**Goal:** Make the profile page feel like a native iOS app without losing Versum's visual identity, UX patterns, or GSAP animations.

---

## Context

The profile page currently reads as a generic web layout: avatar left-aligned with name, an outlined "Editar" button in the top-right corner, and a shadcn `<Card>` with visible border for the journey stats. These patterns signal "web application" and break the native-app illusion.

The redesign targets three areas: the profile view header, the journey section, and the edit form. Typography, color palette, animation timing, and overall information hierarchy are preserved.

---

## Section 1 — Profile Header (view mode)

### Layout change
Remove the `flex items-start justify-between` wrapper that places the avatar+name on the left and the edit button on the right. Replace with a centered column layout for the identity block.

### Avatar
- Centered, `mx-auto`
- Size: `80px` mobile → `96px` desktop (`w-20 h-20 md:w-24 md:h-24`)
- Remove `ring-1 ring-foreground/10` — rely on the theme's `bg-muted` contrast instead
- GSAP: add `scale: 0.96` to the existing `gsap.from(".profile-header", ...)` entrance so the avatar scales subtly in alongside the fade+translate

### Name / username / bio
- Stacked and centered below the avatar: `text-center`
- Name: keep `text-xl font-normal leading-tight`
- Username: keep `text-sm text-muted-foreground`
- Bio (new): `text-sm text-muted-foreground mt-1`, rendered only when `profile.bio` is non-empty

### Edit action
- Remove the `<Button variant="outline" size="sm">Editar</Button>` block entirely
- Replace with a `PencilSimple` icon (24px, from `@phosphor-icons/react`) as a ghost icon button, `absolute top-4 right-4` (or `fixed` if the page scrolls — use `absolute` within the `relative` profile container)
- No label, no border — just the icon at `text-foreground/60 hover:text-foreground` with a subtle transition

---

## Section 2 — Journey Progress Section

### Remove Card chrome
- Remove `<Card>` and `<CardContent>` wrappers
- Replace with a plain `div` styled `bg-muted/50 rounded-2xl px-5 py-4`
- This swaps visible border for background differentiation — the native iOS "grouped section" pattern

### Section header
- Remove `<Separator>` component and the `flex items-center gap-3` wrapper around it
- Replace with a standalone `<h2>` styled `text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3`
- No decorative line

### Stats grid, progress bar, animations
- No changes — UX and GSAP animations (`journey-stat` stagger, `progress-fill` width animation) are preserved exactly

---

## Section 3 — Edit Form

### Avatar uploader
- Change layout from `flex items-center gap-4` (avatar left, buttons right) to `flex flex-col items-center gap-2` (avatar centered, "Trocar foto" text link below)
- "Trocar foto" becomes a `<button>` styled as `text-sm text-primary font-medium` — no outline, no size prop
- "Remover" stays ghost but also centered, `text-sm text-muted-foreground`
- The "JPEG, PNG ou WEBP. Máx 5 MB." hint moves below the action buttons, centered

### Field grouping
Replace the individual `<Field>` blocks (each with vertical gap) with a single grouped container:

```
<div className="bg-muted/50 rounded-2xl divide-y divide-border/50 overflow-hidden">
  {/* Nome */}
  {/* Username */}
  {/* Bio */}
</div>
```

Each field inside the group:
- `px-4 py-3`
- Label: `text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5`
- Input/Textarea: `border-none bg-transparent focus-visible:ring-0 p-0 text-sm` (removes the shadcn input border — the group container provides context)
- Validation errors and status messages stay in place, styled `text-xs` below the input, inside the group row

### Action buttons
Remove the `flex justify-end gap-2` footer row. Replace with a two-item header bar above the avatar:

```
<div className="flex items-center justify-between mb-6">
  <button type="button" onClick={onDone}
    className="text-sm text-muted-foreground">
    Cancelar
  </button>
  <button type="submit" disabled={...}
    className="text-sm font-semibold text-primary disabled:opacity-40">
    Salvar
  </button>
</div>
```

This mirrors the iOS modal editing pattern (Cancel left / Done right as text).

---

## Animations

All existing GSAP animations are preserved:
- `gsap.from(".profile-header", { y: 16, opacity: 0, ... })` — add `scale: 0.96` to this tween
- `gsap.from(".journey-stat", { y: 12, opacity: 0, stagger: 0.06, ... })` — unchanged
- `gsap.fromTo(".progress-fill", ...)` — unchanged
- `prefersReducedMotion` path — unchanged

---

## Files to change

| File | Change |
|------|--------|
| `profile-header.tsx` | Centered layout, larger avatar, bio display, remove edit button |
| `profile-view.tsx` | Remove edit button block, add `PencilSimple` icon button, add `relative` to container, pass bio through |
| `journey-progress-section.tsx` | Remove `<Card>`/`<CardContent>`, plain `div` with `bg-muted/50 rounded-2xl`, simpler section header |
| `avatar-uploader.tsx` | Centered column layout, text-link style buttons |
| `profile-edit-form.tsx` | Grouped fields container, header bar actions, remove footer buttons |

No new files. No changes to routing, data fetching, animation logic, or the app shell.

---

## Out of scope

- App navbar / shell layout
- Color palette or typography tokens
- Data model / API
- Skeleton loading state (can follow up separately)
