import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Freela <onboarding@resend.dev>";

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Benvenuto su Freela!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Ciao ${name}!</h1>
          <p>Grazie per esserti registrato su <strong>Freela</strong>.</p>
          <p>Ora puoi iniziare a gestire clienti, progetti, fatture e ore di lavoro tutto in un unico posto.</p>
          <div style="margin: 30px 0;">
            <a href="https://freela-web-eight.vercel.app/dashboard" 
               style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Vai alla Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Se non hai creato tu questo account, ignora questa email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Errore invio email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Errore invio email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset password Freela",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Reset Password</h1>
          <p>Hai richiesto di reimpostare la tua password.</p>
          <p>Clicca il pulsante qui sotto per procedere (il link scade in 1 ora):</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Resetta Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Se non hai richiesto tu il reset, ignora questa email. La tua password rimarra invariata.</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">Link: ${resetLink}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Errore invio email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Errore invio email:", error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(to: string, name: string, verifyLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verifica la tua email - Freela",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Ciao ${name}!</h1>
          <p>Grazie per esserti registrato su <strong>Freela</strong>.</p>
          <p>Per completare la registrazione e attivare il tuo account, conferma la tua email cliccando sul pulsante qui sotto:</p>
          <div style="margin: 30px 0;">
            <a href="${verifyLink}" 
               style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
              Verifica Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Il link scade in 24 ore.</p>
          <p style="color: #666; font-size: 14px;">Se non hai creato tu questo account, ignora questa email.</p>
          <p style="color: #666; font-size: 12px; word-break: break-all; margin-top: 20px;">Link diretto: ${verifyLink}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Errore invio email verifica:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Errore invio email verifica:", error);
    return { success: false, error };
  }
}