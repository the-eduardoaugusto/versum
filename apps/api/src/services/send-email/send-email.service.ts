import { resend } from "@/libs/resend/client";
import { CreateEmailOptions } from "resend";

export class SendEmailService {
  async sendEmail(payload: Omit<CreateEmailOptions, "from">) {
    await resend.emails.send({
      ...payload,
      from: "no-reply@send.eduardoaugusto.is-a.dev",
    } as CreateEmailOptions);
  }
}
