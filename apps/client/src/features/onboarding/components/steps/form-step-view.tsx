"use client";

import { useGSAP } from "@gsap/react";
import { useForm } from "@tanstack/react-form";
import { gsap, SplitText } from "gsap/src/all";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type z from "zod";
import { ActionButton } from "@/components/shared/action-button";
import { FieldError } from "@/components/shared/field-error";
import type { StepTransitionHandle } from "@/components/shared/step-transition";
import { StepTransition } from "@/components/shared/step-transition";
import { getApiV1ProfilesUsername } from "@/dal/orval/fetch/profiles/profiles";
import { usePostApiV1ProfilesMe } from "@/dal/orval/tanstackQuery/profiles/profiles";
import { cn } from "@/lib/utils";
import type { FormStep, OnboardingValues, StepDirection } from "../../types";
import { onboardingFormSchema } from "../../types";

interface StepAnimationProps {
  direction: StepDirection;
  onExitDone: () => void;
}

type FormStepField = FormStep["field"];

function fieldSchema(field: FormStepField) {
  return onboardingFormSchema.pick({ [field]: true } as Record<
    FormStepField,
    true
  >);
}

interface FormStepViewProps extends StepAnimationProps {
  step: FormStep;
  defaultValue?: string;
  collectedValues: Partial<OnboardingValues>;
  onNext: (patch: Partial<OnboardingValues>) => void;
  onBack: () => void;
  isFirstFormStep: boolean;
  isLastFormStep: boolean;
  onError: (message: string) => void;
}

const allowedKeys: (keyof OnboardingValues)[] = ["name", "username", "bio"];

function isValidPatch(obj: Partial<OnboardingValues>): obj is OnboardingValues {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  return Object.keys(obj).every((key) =>
    allowedKeys.includes(key as keyof OnboardingValues),
  );
}

async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    await getApiV1ProfilesUsername(username);
    return false; // profile found → username taken
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404) return true; // not found → available
    return true; // network/auth error — don't block the user
  }
}

export function FormStepView({
  step,
  defaultValue = "",
  collectedValues,
  direction,
  onExitDone,
  onNext,
  onBack,
  isFirstFormStep,
  isLastFormStep,
  onError,
}: FormStepViewProps) {
  const transitionRef = useRef<StepTransitionHandle>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLParagraphElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutateAsync: createProfile, isPending } = usePostApiV1ProfilesMe({
    fetch: {
      credentials: "include",
    },
  });

  const form = useForm({
    defaultValues: {
      [step.field]: defaultValue,
    } as Record<FormStepField, string>,
    validators: {
      onChange: fieldSchema(step.field) as z.ZodObject<
        Record<FormStepField, z.ZodString>
      >,
    },
    onSubmit: async ({ value }) => {
      setApiError(null);

      const patch = {
        [step.field]: value[step.field],
      } as Partial<OnboardingValues>;

      if (!isValidPatch(patch)) return;

      if (step.field === "username") {
        const available = await checkUsernameAvailable(value.username);
        if (!available) {
          setApiError("Este username já está em uso. Escolha outro.");
          return;
        }
      }

      if (isLastFormStep) {
        const allValues = onboardingFormSchema.parse({
          ...collectedValues,
          ...patch,
        });

        const res = await createProfile({
          data: {
            name: allValues.name,
            username: allValues.username,
            bio: allValues.bio,
          },
        });

        if (res.status !== 201) {
          setApiError(
            res.data.message ?? "Não foi possível completar o cadastro.",
          );
          return;
        }

        const profile = res.data?.data;
        if (profile) {
          toast.success(`Bem-vindo, ${profile.name}!`);
        }
      }

      transitionRef.current?.triggerExit(direction, () => {
        onExitDone();
        onNext(patch);
      });
    },
  });

  function handleBack() {
    transitionRef.current?.triggerExit(-1, () => {
      onExitDone();
      onBack();
    });
  }

  useGSAP(() => {
    if (labelRef.current && subtitleRef.current) {
      const splitedLabel = new SplitText(labelRef.current, { type: "words" });
      const splitedSubtitle = new SplitText(subtitleRef.current, {
        type: "words",
      });
      gsap.set(splitedLabel.words, {
        opacity: 0,
        transform: "translateY(20px)",
        filter: "blur(10px)",
      });
      gsap.set(splitedSubtitle.words, {
        opacity: 0,
        transform: "translateY(20px)",
        filter: "blur(10px)",
      });

      wrapperRef.current?.classList.remove("invisible");

      gsap.to(splitedLabel.words, {
        opacity: 1,
        transform: "translateY(0)",
        filter: "blur(0px)",
        stagger: 0.1,
        duration: 1,
        ease: "power4.out",
      });
      gsap.to(splitedSubtitle.words, {
        opacity: 1,
        transform: "translateY(0)",
        filter: "blur(0px)",
        stagger: 0.1,
        duration: 0.6,
        ease: "power4.out",
      });

      return () => {
        if (splitedLabel.words) {
          gsap.killTweensOf(splitedLabel.words);
        }
        if (splitedSubtitle.words) {
          gsap.killTweensOf(splitedSubtitle.words);
        }
      };
    }
  }, []);

  return (
    <StepTransition ref={transitionRef}>
      <div className="flex h-full flex-col justify-center gap-6 px-8">
        <div ref={wrapperRef} className="invisible flex flex-col gap-2">
          <p
            ref={labelRef}
            className="tracking-tight text-foreground overflow-hidden font-instrument-serif text-3xl sm:text-5xl"
          >
            {step.title}
          </p>
          <p
            className="text-base sm:text-xl text-foreground/50 font-instrument-sans"
            ref={subtitleRef}
          >
            {step.description}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          noValidate
        >
          <form.Field
            name={step.field}
            validators={{
              onChange: fieldSchema(step.field).shape[step.field],
            }}
          >
            {(field) => (
              <div>
                <input
                  id={`field-${step.field}`}
                  type={step.inputType}
                  placeholder={step.placeholder}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={field.handleBlur}
                  autoComplete="off"
                  className={cn(
                    "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm",
                    "text-neutral-900 placeholder-neutral-400 outline-none ring-0",
                    "transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10",
                    "dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
                    "dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white/10",
                    apiError && "border-red-500 dark:border-red-400",
                  )}
                />
                <FieldError field={field} />
                {apiError && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
                    {apiError}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <ActionButton label="Continuar" type="submit" disabled={isPending} />
        </form>

        {!isFirstFormStep && (
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              "mt-3 w-full text-center text-sm text-neutral-400 hover:text-neutral-600",
              "dark:hover:text-neutral-300",
            )}
          >
            Voltar
          </button>
        )}
      </div>
    </StepTransition>
  );
}
