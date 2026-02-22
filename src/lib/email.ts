import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL =
  process.env.EMAIL_FROM || "ncts.app <onboarding@resend.dev>";

export async function sendWorkspaceInviteEmail(params: {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
}) {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping invite email to",
      params.to,
    );
    return;
  }

  const { to, inviterName, workspaceName, role, inviteUrl } = params;

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${inviterName} invited you to ${workspaceName} on ncts.app`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fefdfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e8eaed;">
    <div style="margin-bottom:24px;">
      <span style="font-size:18px;font-weight:700;color:#0a0f1c;">ncts</span><span style="font-size:18px;font-weight:700;color:#d97706;">.</span><span style="font-size:18px;font-weight:700;color:#0a0f1c;">app</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0a0f1c;">You've been invited</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      <strong>${inviterName}</strong> invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;padding:10px 24px;background:#0a0f1c;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
      Accept Invite
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
      If you weren't expecting this invite, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim(),
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error.message);
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping password reset email to",
      params.to,
    );
    return;
  }

  const { to, resetUrl } = params;

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your ncts.app password",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fefdfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e8eaed;">
    <div style="margin-bottom:24px;">
      <span style="font-size:18px;font-weight:700;color:#0a0f1c;">ncts</span><span style="font-size:18px;font-weight:700;color:#d97706;">.</span><span style="font-size:18px;font-weight:700;color:#0a0f1c;">app</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0a0f1c;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:10px 24px;background:#0a0f1c;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
      Reset Password
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim(),
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error.message);
  }
}

export async function sendGuideDownloadEmail(params: {
  to: string;
  firstName?: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping guide email to", params.to);
    return;
  }

  const { to, firstName } = params;
  const name = firstName || "there";
  const pdfUrl = `${APP_URL}/nct-guide.pdf`;
  const readUrl = `${APP_URL}/guide/read`;

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your NCT Guide is ready — download it here 📖",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fefdfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:40px 32px;background:#ffffff;border-radius:12px;border:1px solid #e8eaed;">
    <div style="margin-bottom:28px;">
      <span style="font-size:18px;font-weight:700;color:#0a0f1c;">ncts</span><span style="font-size:18px;font-weight:700;color:#d97706;">.</span><span style="font-size:18px;font-weight:700;color:#0a0f1c;">app</span>
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#0a0f1c;">Hey ${name}, your NCT Guide is ready.</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;">
      Everything you need to run Narratives, Commitments &amp; Tasks — from first principles to your first cycle. No consultant required.
    </p>
    <a href="${pdfUrl}" style="display:inline-block;padding:12px 28px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
      ↓ Download the PDF
    </a>
    <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">
      Or <a href="${readUrl}" style="color:#d97706;text-decoration:underline;">read it in your browser</a>
    </p>
    <div style="margin:32px 0;border-top:1px solid #f3f4f6;"></div>
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0a0f1c;">What's inside:</p>
    <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#6b7280;line-height:2.2;">
      <li>What NCT is and where it came from</li>
      <li>The three layers — Narrative, Commitment, Task — with real examples</li>
      <li>How to write your first cycle in under 30 minutes</li>
      <li>NCT vs OKR — the full breakdown</li>
      <li>NCT for Product, Engineering, Marketing &amp; Sales teams</li>
      <li>Common mistakes and how to avoid them</li>
    </ul>
    <div style="margin:32px 0;border-top:1px solid #f3f4f6;"></div>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Ready to put it into practice? ncts.app is the only tool built natively for the NCT framework — free forever to start.
    </p>
    <a href="${APP_URL}/signup" style="display:inline-block;padding:10px 24px;background:#0a0f1c;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
      Start free — no credit card
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
      You're receiving this because you requested the NCT Guide from ncts.app.
    </p>
  </div>
</body>
</html>
    `.trim(),
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error.message);
  }
}
