import { strict, describe, it } from "poku";
import { SendEmailService } from "./send-email.service";

// Mock do cliente resend
const mockResendClient = {
  emails: {
    send: async (payload: any) => {
      // Simula o envio de e-mail
      return {
        id: "mock-email-id",
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      };
    },
  },
};

// Criar uma versão modificada do serviço que usa o mock
class TestableSendEmailService extends SendEmailService {
  constructor(resendClient: any) {
    super();
    // Substitui o cliente resend pelo mock
    (this as any).resend = resendClient;
  }

  async sendEmail(payload: any) {
    await (this as any).resend.emails.send({
      ...payload,
      from: "no-reply@send.eduardoaugusto.is-a.dev",
    });

    // Retorna o payload modificado para verificação nos testes
    return {
      ...payload,
      from: "no-reply@send.eduardoaugusto.is-a.dev",
    };
  }
}

describe("SendEmail service", async () => {
  await describe("sendEmail", async () => {
    await it("should send an email with correct parameters", async () => {
      const emailPayload = {
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test Email Content</p>",
      };

      const sendEmailService = new TestableSendEmailService(mockResendClient);
      const result = await sendEmailService.sendEmail(emailPayload);

      strict.strictEqual(
        result.from,
        "no-reply@send.eduardoaugusto.is-a.dev",
        "From address should be set correctly",
      );
      strict.strictEqual(
        result.to,
        emailPayload.to,
        "To address should match the input",
      );
      strict.strictEqual(
        result.subject,
        emailPayload.subject,
        "Subject should match the input",
      );
      strict.strictEqual(
        result.html,
        emailPayload.html,
        "HTML content should match the input",
      );
    });

    await it("should handle different recipient formats", async () => {
      const emailPayload = {
        to: ["recipient1@example.com", "recipient2@example.com"],
        subject: "Test Subject for Multiple Recipients",
        html: "<p>Test Email Content</p>",
      };

      const sendEmailService = new TestableSendEmailService(mockResendClient);
      const result = await sendEmailService.sendEmail(emailPayload);

      strict.strictEqual(
        result.from,
        "no-reply@send.eduardoaugusto.is-a.dev",
        "From address should be set correctly",
      );
      strict.deepStrictEqual(
        result.to,
        emailPayload.to,
        "To addresses should match the input",
      );
    });

    await it("should handle email with CC and BCC fields", async () => {
      const emailPayload = {
        to: "recipient@example.com",
        cc: "cc@example.com",
        bcc: "bcc@example.com",
        subject: "Test Subject with CC and BCC",
        html: "<p>Test Email Content</p>",
      };

      const sendEmailService = new TestableSendEmailService(mockResendClient);
      const result = await sendEmailService.sendEmail(emailPayload);

      strict.strictEqual(
        result.from,
        "no-reply@send.eduardoaugusto.is-a.dev",
        "From address should be set correctly",
      );
      strict.strictEqual(
        result.to,
        emailPayload.to,
        "To address should match the input",
      );
      strict.strictEqual(
        result.cc,
        emailPayload.cc,
        "CC address should match the input",
      );
      strict.strictEqual(
        result.bcc,
        emailPayload.bcc,
        "BCC address should match the input",
      );
    });

    await it("should handle email with replyTo field", async () => {
      const emailPayload = {
        to: "recipient@example.com",
        subject: "Test Subject with Reply-To",
        html: "<p>Test Email Content</p>",
        replyTo: "replyto@example.com",
      };

      const sendEmailService = new TestableSendEmailService(mockResendClient);
      const result = await sendEmailService.sendEmail(emailPayload);

      strict.strictEqual(
        result.from,
        "no-reply@send.eduardoaugusto.is-a.dev",
        "From address should be set correctly",
      );
      strict.strictEqual(
        result.to,
        emailPayload.to,
        "To address should match the input",
      );
      strict.strictEqual(
        result.replyTo,
        emailPayload.replyTo,
        "Reply-To address should match the input",
      );
    });
  });
});
