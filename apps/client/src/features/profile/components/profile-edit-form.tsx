"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
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
import { getGetApiV1ProfilesMeQueryKey } from "../hooks/use-current-profile";
import { AvatarUploader } from "./avatar-uploader";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const BIO_MAX = 500;

type UsernameState = "idle" | "checking" | "available" | "taken";

interface ProfileEditFormProps {
  profile: FullProfile;
  onDone: () => void;
}

export function ProfileEditForm({ profile, onDone }: ProfileEditFormProps) {
  const queryClient = useQueryClient();
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
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1ProfilesMeQueryKey(),
        });
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
      await queryClient.invalidateQueries({
        queryKey: getGetApiV1ProfilesMeQueryKey(),
      });
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
      await queryClient.invalidateQueries({
        queryKey: getGetApiV1ProfilesMeQueryKey(),
      });
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
        pictureUrl={profile.avatarUrl ?? null}
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
                className="border-none bg-transparent focus-visible:ring-0 shadow-none p-0 text-sm resize-none min-h-0"
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
