# Profile Native-Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the profile page (view + edit form) to feel like a native iOS app while preserving Versum's color palette, typography, UX patterns, and GSAP animations.

**Architecture:** Pure UI changes across 5 existing component files. No new files, no routing changes, no API changes. Each task modifies one component independently and commits.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/ui, phosphor-icons, GSAP

## Global Constraints

- Run `bun --filter 'client' typecheck` after each task — must pass before committing
- Run `bun --filter 'client' lint` after each task — warnings OK, errors block commit
- All GSAP animation class names (`.profile-header`, `.journey-stat`, `.progress-fill`) must be preserved exactly
- Icon imports from `@phosphor-icons/react` use the `Icon` suffix (e.g. `PencilSimpleIcon`)
- Tailwind classes use `bg-muted/50`, `rounded-2xl`, `divide-y divide-border/50` — Tailwind v4, no config changes needed
- Do not touch `profile-skeleton.tsx`, routing, data fetching, or the app shell

---

### Task 1: Journey Progress Section — remove Card chrome, simplify header

**Files:**
- Modify: `apps/client/src/features/profile/components/journey-progress-section.tsx`

**Interfaces:**
- Consumes: `JourneyStatusResponseData` (unchanged)
- Produces: same `JourneyProgressSection` export, same props

- [ ] **Step 1: Replace the file contents**

Replace `apps/client/src/features/profile/components/journey-progress-section.tsx` with:

```tsx
import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";

interface JourneyProgressSectionProps {
  journey: JourneyStatusResponseData;
}

export function JourneyProgressSection({
  journey,
}: JourneyProgressSectionProps) {
  const stats = [
    { value: journey.chaptersRead, label: "Lidos" },
    { value: journey.chaptersRemaining, label: "Restantes" },
    { value: `${journey.percentComplete}%`, label: "Progresso" },
  ] as const;

  return (
    <section className="px-6 pb-6" aria-label="Progresso da Jornada">
      <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
        Jornada
      </h2>

      <div className="bg-muted/50 rounded-2xl px-5 py-4">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="journey-stat flex flex-col items-center gap-1.5 text-center"
            >
              <span className="text-2xl font-semibold tabular-nums leading-none">
                {value}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {journey.isAtEnd ? (
          <div className="flex items-center justify-center py-1">
            <span className="text-xs text-muted-foreground tracking-wide">
              Jornada concluída
            </span>
          </div>
        ) : (
          <div
            role="progressbar"
            aria-valuenow={journey.percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso geral da jornada"
            className="h-1 rounded-full bg-muted overflow-hidden"
          >
            <div className="progress-fill h-full rounded-full bg-foreground" />
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
bun --filter 'client' typecheck && bun --filter 'client' lint
```

Expected: typecheck exits 0, lint exits 0 (warnings OK).

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/journey-progress-section.tsx
git commit -m "feat(profile): replace card chrome with grouped native-feel container"
```

---

### Task 2: Profile Header — centered layout, larger avatar, bio display

**Files:**
- Modify: `apps/client/src/features/profile/components/profile-header.tsx`

**Interfaces:**
- Consumes: `FullProfile` — uses `profile.name`, `profile.username`, `profile.pictureUrl`, `profile.bio` (bio is already on the type, just not currently rendered)
- Produces: same `ProfileHeader` export, same `ProfileHeaderProps`

- [ ] **Step 1: Replace the file contents**

Replace `apps/client/src/features/profile/components/profile-header.tsx` with:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface ProfileHeaderProps {
  profile: FullProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = getInitials(profile.name);

  return (
    <div className="profile-header flex flex-col items-center gap-3 px-6 pt-8 pb-4">
      <div
        className={cn(
          "relative shrink-0 rounded-full overflow-hidden",
          "w-20 h-20 md:w-24 md:h-24",
          "bg-muted",
        )}
      >
        {profile.pictureUrl ? (
          <Avatar className="w-full h-full">
            <AvatarImage
              src={profile.pictureUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
            <AvatarFallback className="w-full h-full rounded-full">
              <Skeleton className="w-full h-full" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            role="img"
            className="w-full h-full flex items-center justify-center"
            aria-label={profile.name}
          >
            <span className="text-lg font-semibold text-muted-foreground select-none">
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5 min-w-0 text-center">
        <h1 className="text-xl font-normal leading-tight">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
bun --filter 'client' typecheck && bun --filter 'client' lint
```

Expected: typecheck exits 0, lint exits 0 (warnings OK).

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/profile-header.tsx
git commit -m "feat(profile): center header layout, enlarge avatar, display bio"
```

---

### Task 3: Profile View — pencil icon action, relative container, scale animation

**Files:**
- Modify: `apps/client/src/features/profile/components/profile-view.tsx`

**Interfaces:**
- Consumes: `ProfileHeader` (centered, no edit button — from Task 2), `JourneyProgressSection` (from Task 1), `ProfileEditForm` (unchanged)
- Produces: same `ProfileView` export, same props

- [ ] **Step 1: Replace the file contents**

Replace `apps/client/src/features/profile/components/profile-view.tsx` with:

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";
import { JourneyProgressSection } from "./journey-progress-section";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfileHeader } from "./profile-header";

interface ProfileViewProps {
  profile: FullProfile;
  journey: JourneyStatusResponseData | null;
}

export function ProfileView({ profile, journey }: ProfileViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  const [isEditing, setIsEditing] = useState(false);

  useGSAP(
    () => {
      const reveal = () => containerRef.current?.classList.remove("invisible");

      if (prefersReducedMotion) {
        if (journey) {
          gsap.set(".progress-fill", { width: `${journey.percentComplete}%` });
        }
        reveal();
        return;
      }

      gsap.from(".profile-header", {
        y: 16,
        scale: 0.96,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });

      gsap.from(".journey-stat", {
        y: 12,
        opacity: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.1,
        clearProps: "transform,opacity",
      });

      if (journey && !journey.isAtEnd) {
        gsap.fromTo(
          ".progress-fill",
          { width: "0%" },
          {
            width: `${journey.percentComplete}%`,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.3,
          },
        );
      }

      reveal();
    },
    {
      scope: containerRef,
      dependencies: [
        prefersReducedMotion,
        journey?.percentComplete,
        journey?.isAtEnd,
        isEditing,
      ],
    },
  );

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex flex-col min-h-full">
        <ProfileEditForm profile={profile} onDone={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="invisible relative flex flex-col min-h-full max-w-screen"
    >
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label="Editar perfil"
        className="absolute top-4 right-4 p-2 rounded-full text-foreground/50 hover:text-foreground transition-colors"
      >
        <PencilSimpleIcon size={20} />
      </button>

      <ProfileHeader profile={profile} />

      {journey ? (
        <JourneyProgressSection journey={journey} />
      ) : (
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Inicie sua jornada de leitura para ver seu progresso aqui.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
bun --filter 'client' typecheck && bun --filter 'client' lint
```

Expected: typecheck exits 0, lint exits 0 (warnings OK).

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/profile-view.tsx
git commit -m "feat(profile): replace edit button with pencil icon, add scale to GSAP entrance"
```

---

### Task 4: Avatar Uploader — centered column layout, text-link buttons

**Files:**
- Modify: `apps/client/src/features/profile/components/avatar-uploader.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: same `AvatarUploader` export, same `AvatarUploaderProps` — no prop changes

- [ ] **Step 1: Replace the file contents**

Replace `apps/client/src/features/profile/components/avatar-uploader.tsx` with:

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { validateAvatarFile } from "../api/profile-edit.api";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarUploaderProps {
  name: string;
  pictureUrl: string | null;
  isUploading: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

export function AvatarUploader({
  name,
  pictureUrl,
  isUploading,
  onSelectFile,
  onRemove,
}: AvatarUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const error = validateAvatarFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onSelectFile(file);
  }

  const shown = preview ?? pictureUrl ?? undefined;

  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar size="lg" className="size-20">
        {shown ? (
          <AvatarImage src={shown} alt={name} />
        ) : (
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        )}
      </Avatar>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
      />

      <div className="flex gap-3">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-primary disabled:opacity-40"
        >
          {isUploading ? "Enviando..." : "Trocar foto"}
        </button>
        {pictureUrl && !preview && (
          <button
            type="button"
            disabled={isUploading}
            onClick={onRemove}
            className="text-sm text-muted-foreground disabled:opacity-40"
          >
            Remover
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPEG, PNG ou WEBP. Máx 5 MB.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
bun --filter 'client' typecheck && bun --filter 'client' lint
```

Expected: typecheck exits 0, lint exits 0 (warnings OK).

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/avatar-uploader.tsx
git commit -m "feat(profile): center avatar uploader, convert buttons to text-link style"
```

---

### Task 5: Edit Form — grouped fields, header bar actions, remove footer buttons

**Files:**
- Modify: `apps/client/src/features/profile/components/profile-edit-form.tsx`

**Interfaces:**
- Consumes: `AvatarUploader` (centered layout — from Task 4), `Input`, `Textarea` from shadcn — className overrides remove border/ring so the grouped container provides visual context
- Produces: same `ProfileEditForm` export, same `ProfileEditFormProps`

- [ ] **Step 1: Replace the file contents**

Replace `apps/client/src/features/profile/components/profile-edit-form.tsx` with:

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import { usePatchApiV1ProfilesMe } from "@/dal/orval/tanstackQuery/profiles/profiles";
import {
  checkUsername,
  deleteAvatar,
  uploadAvatar,
} from "../api/profile-edit.api";
import { AvatarUploader } from "./avatar-uploader";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const BIO_MAX = 500;

type UsernameState = "idle" | "checking" | "available" | "taken";

interface ProfileEditFormProps {
  profile: FullProfile;
  onDone: () => void;
}

export function ProfileEditForm({ profile, onDone }: ProfileEditFormProps) {
  const router = useRouter();
  const { mutateAsync: patchProfile } = usePatchApiV1ProfilesMe();

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameId = useId();
  const usernameId = useId();
  const bioId = useId();

  function scheduleUsernameCheck(value: string) {
    const next = value.trim().toLowerCase();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (
      next === profile.username ||
      next.length < 3 ||
      !USERNAME_REGEX.test(next)
    ) {
      setUsernameState("idle");
      return;
    }

    setUsernameState("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkUsername(next);
        setUsernameState(available ? "available" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 400);
  }

  const form = useForm({
    defaultValues: {
      name: profile.name,
      username: profile.username,
      bio: profile.bio ?? "",
    },
    async onSubmit({ value }) {
      if (usernameState === "taken") {
        toast.error("Este nome de usuário já está em uso.");
        return;
      }
      const toastId = toast.loading("Salvando perfil...");
      try {
        await patchProfile({
          data: {
            name: value.name.trim(),
            username: value.username.trim().toLowerCase(),
            bio: value.bio.trim() ? value.bio.trim() : null,
          },
        });
        toast.success("Perfil atualizado.", { id: toastId });
        router.refresh();
        onDone();
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Não foi possível salvar o perfil.";
        toast.error(message, { id: toastId });
      }
    },
  });

  async function handleAvatarSelect(file: File) {
    setAvatarUploading(true);
    const toastId = toast.loading("Enviando foto...");
    try {
      await uploadAvatar(file);
      toast.success("Foto atualizada.", { id: toastId });
      router.refresh();
    } catch {
      toast.error("Não foi possível enviar a foto.", { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    const toastId = toast.loading("Removendo foto...");
    try {
      await deleteAvatar();
      toast.success("Foto removida.", { id: toastId });
      router.refresh();
    } catch {
      toast.error("Não foi possível remover a foto.", { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6 px-6 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-muted-foreground"
        >
          Cancelar
        </button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || usernameState === "checking"}
              className="text-sm font-semibold text-primary disabled:opacity-40"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          )}
        </form.Subscribe>
      </div>

      <AvatarUploader
        name={profile.name}
        pictureUrl={profile.pictureUrl ?? null}
        isUploading={avatarUploading}
        onSelectFile={handleAvatarSelect}
        onRemove={handleAvatarRemove}
      />

      <div className="bg-muted/50 rounded-2xl divide-y divide-border/50 overflow-hidden">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              value.trim().length === 0
                ? "Nome é obrigatório"
                : value.trim().length > 100
                  ? "Nome deve ter no máximo 100 caracteres"
                  : undefined,
          }}
        >
          {(field) => (
            <div className="px-4 py-3">
              <label
                htmlFor={nameId}
                className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5"
              >
                Nome
              </label>
              <Input
                id={nameId}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                className="border-none bg-transparent focus-visible:ring-0 shadow-none p-0 h-auto text-sm"
              />
              <FieldError
                errors={field.state.meta.errors.map((m) => ({
                  message: String(m),
                }))}
              />
            </div>
          )}
        </form.Field>

        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) => {
              const v = value.trim();
              if (v.length < 3) return "Mínimo de 3 caracteres";
              if (v.length > 50) return "Máximo de 50 caracteres";
              if (!USERNAME_REGEX.test(v)) return "Apenas letras, números e _";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="px-4 py-3">
              <label
                htmlFor={usernameId}
                className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5"
              >
                Nome de usuário
              </label>
              <Input
                id={usernameId}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  scheduleUsernameCheck(e.target.value);
                }}
                aria-invalid={
                  field.state.meta.errors.length > 0 ||
                  usernameState === "taken"
                }
                aria-describedby={`${usernameId}-status`}
                className="border-none bg-transparent focus-visible:ring-0 shadow-none p-0 h-auto text-sm"
              />
              <p
                id={`${usernameId}-status`}
                className="text-xs text-muted-foreground mt-0.5"
                aria-live="polite"
              >
                {usernameState === "checking" &&
                  "Verificando disponibilidade..."}
                {usernameState === "available" && "Disponível ✓"}
                {usernameState === "taken" && (
                  <span className="text-destructive">Já está em uso</span>
                )}
              </p>
              <FieldError
                errors={field.state.meta.errors.map((m) => ({
                  message: String(m),
                }))}
              />
            </div>
          )}
        </form.Field>

        <form.Field
          name="bio"
          validators={{
            onChange: ({ value }) =>
              value.length > BIO_MAX
                ? `Máximo de ${BIO_MAX} caracteres`
                : undefined,
          }}
        >
          {(field) => (
            <div className="px-4 py-3">
              <label
                htmlFor={bioId}
                className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5"
              >
                Bio
              </label>
              <Textarea
                id={bioId}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                maxLength={BIO_MAX}
                aria-invalid={field.state.meta.errors.length > 0}
                className="border-none bg-transparent focus-visible:ring-0 shadow-none p-0 text-sm resize-none"
              />
              <p className="text-right text-xs text-muted-foreground mt-0.5">
                {field.state.value.length}/{BIO_MAX}
              </p>
              <FieldError
                errors={field.state.meta.errors.map((m) => ({
                  message: String(m),
                }))}
              />
            </div>
          )}
        </form.Field>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
bun --filter 'client' typecheck && bun --filter 'client' lint
```

Expected: typecheck exits 0, lint exits 0 (warnings OK).

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/profile/components/profile-edit-form.tsx
git commit -m "feat(profile): grouped field layout, iOS-style header bar actions"
```
