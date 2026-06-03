import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  confirmationUrl: string;
  fullName?: string;
}

const APP_BASE = "https://eduzambia.netlify.app";

// Rewrite any confirmation URL so the final landing page is eduzambia.netlify.app
function normaliseRedirect(url: string): string {
  try {
    const u = new URL(url);
    const redirectTo = u.searchParams.get("redirect_to");
    if (redirectTo) {
      const r = new URL(redirectTo);
      r.protocol = "https:";
      r.host = "eduzambia.netlify.app";
      u.searchParams.set("redirect_to", r.toString());
    }
    return u.toString();
  } catch {
    return url;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, fullName }: EmailVerificationRequest = await req.json();
    const link = normaliseRedirect(confirmationUrl);
    const name = (fullName || "Learner").split(" ")[0];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Verify your Synapse · EduZambia account</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%);padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px -12px rgba(0,0,0,0.5);">

        <!-- Hero -->
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 50%,#db2777 100%);padding:48px 40px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.18);backdrop-filter:blur(10px);width:72px;height:72px;border-radius:20px;line-height:72px;font-size:36px;margin-bottom:20px;">🎓</div>
          <h1 style="margin:0;font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Welcome to Synapse</h1>
          <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);font-weight:500;">EduZambia · BrightSphere Technologies</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:40px 40px 16px;">
          <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;font-weight:700;">Hi ${name}, you're in. 🚀</h2>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#475569;">
            One last step — confirm your email so we can sync your progress, save your work, and unlock your full Synapse workspace.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:24px 40px 8px;text-align:center;">
          <a href="${link}" style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:14px;box-shadow:0 12px 24px -8px rgba(124,58,237,0.5);">
            Verify my email →
          </a>
          <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">After verification you'll land on <b style="color:#475569;">eduzambia.netlify.app</b></p>
        </td></tr>

        <!-- Feature grid -->
        <tr><td style="padding:32px 40px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding:14px;background:#eff6ff;border-radius:14px;vertical-align:top;">
                <div style="font-size:22px;margin-bottom:6px;">🧠</div>
                <div style="font-size:13px;font-weight:700;color:#1e3a8a;">AI Tutor</div>
                <div style="font-size:11px;color:#475569;margin-top:2px;">24/7 personalised learning</div>
              </td>
              <td width="12"></td>
              <td width="50%" style="padding:14px;background:#f5f3ff;border-radius:14px;vertical-align:top;">
                <div style="font-size:22px;margin-bottom:6px;">📚</div>
                <div style="font-size:13px;font-weight:700;color:#5b21b6;">ECZ Past Papers</div>
                <div style="font-size:11px;color:#475569;margin-top:2px;">2003 – 2024 archive</div>
              </td>
            </tr>
            <tr><td colspan="3" style="height:12px;"></td></tr>
            <tr>
              <td width="50%" style="padding:14px;background:#fdf2f8;border-radius:14px;vertical-align:top;">
                <div style="font-size:22px;margin-bottom:6px;">👥</div>
                <div style="font-size:13px;font-weight:700;color:#9d174d;">Study Groups</div>
                <div style="font-size:11px;color:#475569;margin-top:2px;">Learn with peers nationwide</div>
              </td>
              <td width="12"></td>
              <td width="50%" style="padding:14px;background:#ecfdf5;border-radius:14px;vertical-align:top;">
                <div style="font-size:22px;margin-bottom:6px;">🏆</div>
                <div style="font-size:13px;font-weight:700;color:#065f46;">Skill Passport</div>
                <div style="font-size:11px;color:#475569;margin-top:2px;">Verified portfolio</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Fallback link -->
        <tr><td style="padding:28px 40px 8px;">
          <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            <p style="margin:0 0 6px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Button not working?</p>
            <a href="${link}" style="font-size:11px;color:#2563eb;word-break:break-all;text-decoration:none;">${link}</a>
          </div>
        </td></tr>

        <!-- Notice -->
        <tr><td style="padding:20px 40px 0;">
          <div style="padding:12px 14px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:10px;">
            <p style="margin:0;font-size:12px;color:#78350f;">⏰ This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px 40px 36px;text-align:center;border-top:1px solid #f1f5f9;margin-top:24px;">
          <p style="margin:0 0 6px;font-size:13px;color:#475569;font-weight:600;">Synapse · EduZambia</p>
          <p style="margin:0 0 12px;font-size:11px;color:#94a3b8;">Built in Zambia, for Africa. Engineered for humanity.</p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 BrightSphere Technologies · <a href="${APP_BASE}" style="color:#94a3b8;text-decoration:none;">eduzambia.netlify.app</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "Synapse EduZambia <onboarding@resend.dev>",
      to: [email],
      subject: `${name}, verify your Synapse account 🎓`,
      html,
    });

    console.log("Email verification sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
