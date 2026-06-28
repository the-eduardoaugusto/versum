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
    e.target.value = ""; // allow re-selecting the same file
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
