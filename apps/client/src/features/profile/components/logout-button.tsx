"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getPostApiV1AuthLogoutMutationOptions } from "@/dal/orval/tanstackQuery/auth/auth";

export default function LogoutButton() {
  const mutation = useMutation({
    ...getPostApiV1AuthLogoutMutationOptions(),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  const disabled = mutation.isPending || mutation.isSuccess;

  return (
    <Button
      disabled={disabled}
      onClick={() => mutation.mutate()}
      variant="ghost"
      className="justify-start text-foreground/50 hover:text-foreground transition-colors"
    >
      <SignOutIcon />
      {mutation.isPending ? (
        "Saindo..."
      ) : (
        <span className="hidden md:inline">Sair</span>
      )}
    </Button>
  );
}
