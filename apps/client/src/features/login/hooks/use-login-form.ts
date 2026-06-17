import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { usePostApiV1AuthMagicLink } from "@/dal/orval/tanstackQuery/auth/auth";
import { loginFormSchema } from "../types";

interface UseLoginFormOptions {
  onSuccess?: () => void;
}

export function useLoginForm({ onSuccess }: UseLoginFormOptions = {}) {
  const { mutateAsync: sendMagicLink, isPending } = usePostApiV1AuthMagicLink();

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: loginFormSchema,
      onChange: loginFormSchema,
    },
    onSubmitInvalid() {
      toast.error("Por favor, corrija os erros no formulário.");
    },
    async onSubmit({ value }) {
      const toastId = toast.loading("Enviando magic link...");

      const res = await sendMagicLink({ data: { email: value.email } });

      if (res.status !== 200) {
        const fallback =
          res.status === 429
            ? "Muitas tentativas. Por favor, aguarde 1 minuto antes de tentar novamente."
            : "Ocorreu um erro desconhecido.";
        toast.error(res.data.message ?? fallback, { id: toastId });
        return;
      }

      toast.success(res.data.message, { id: toastId });
      form.reset();
      onSuccess?.();
    },
  });

  return { form, isPending };
}
