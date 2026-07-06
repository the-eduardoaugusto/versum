"use client"

import { Button } from "@/components/ui/button";
import { getPostApiV1AuthLogoutMutationOptions } from "@/dal/orval/tanstackQuery/auth/auth";
import { SignOutIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";

export default function LogoutButton() {
    const mutation = useMutation({
        ...getPostApiV1AuthLogoutMutationOptions(), onSuccess: () => {
            window.location.href = "/login";
        },
    });
    return (
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} variant="ghost" className="justify-start text-foreground/50 hover:text-foreground transition-colors">
            <SignOutIcon />
            {
                mutation.isPending ? "Saindo..." : "Sair"
            }
        </Button>
    )
}