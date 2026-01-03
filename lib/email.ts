export async function sendOTPEmail(email: string, otp: string) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@ping.app";
  const senderName = process.env.BREVO_SENDER_NAME || "Ping";

  if (!brevoApiKey) {
    throw new Error("Brevo API key is missing");
  }

  const emailContent = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email,
        name: email.split("@")[0],
      },
    ],
    subject: "Your Ping verification code",

    // 🔥 IMPORTANT
    tags: ["transactional", "otp"],
    headers: {
      "X-Mailin-Tag": "transactional",
    },

    textContent: `
Your Ping verification code is: ${otp}

This code will expire in 10 minutes.

If you didn’t try to create an account on Ping, you can safely ignore this email.
    `,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; border:1px solid #e4e4e7;">
          
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px; text-align:center; border-bottom:1px solid #e4e4e7;">
              <div style="height:40px; width:40px; margin:0 auto 12px; border-radius:10px; background:#18181b;"></div>
              <h1 style="margin:0; font-size:20px; font-weight:700; color:#18181b;">
                Ping
              </h1>
              <p style="margin:6px 0 0; font-size:14px; color:#71717a;">
                Verify your email to continue
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; font-size:15px; color:#27272a;">
                Hi,
              </p>

              <p style="margin:0 0 24px; font-size:15px; color:#3f3f46; line-height:1.6;">
                Use the verification code below to complete your signup on <strong>Ping</strong>.
              </p>

              <div style="margin:32px 0; padding:20px; text-align:center; background:#fafafa; border-radius:10px; border:1px dashed #d4d4d8;">
                <div style="font-size:32px; letter-spacing:8px; font-weight:700; color:#18181b; font-family:ui-monospace, SFMono-Regular, Menlo, monospace;">
                  ${otp}
                </div>
              </div>

              <p style="margin:24px 0 0; font-size:14px; color:#52525b;">
                This code will expire in <strong>10 minutes</strong>.
              </p>

              <p style="margin:16px 0 0; font-size:14px; color:#71717a;">
                If you didn’t try to create an account on Ping, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; text-align:center; border-top:1px solid #e4e4e7; background:#fafafa;">
              <p style="margin:0; font-size:12px; color:#a1a1aa;">
                © ${new Date().getFullYear()} Ping. This is an automated message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify(emailContent),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Brevo API error:", errorData);
    throw new Error("Failed to send email via Brevo");
  }

  const result = await response.json();
  return { success: true, messageId: result.messageId };
}
