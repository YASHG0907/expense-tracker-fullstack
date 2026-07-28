// server/src/services/emailService.js

const nodemailer = require("nodemailer");

// Create a reusable "transporter" — the object that actually
// connects to Gmail's SMTP server and sends mail through it.
// Built once, reused for every email sent throughout the app's life.

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── VERIFY CONNECTION ON STARTUP ────────────────────────
// Fails fast and loud if credentials are wrong, instead of
// silently failing the first time a real user triggers an email

transporter.verify((error) => {
  if (error) {
    console.error("❌ Email service failed to connect:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

// ─── SEND BUDGET EXCEEDED ALERT ──────────────────────────

const sendBudgetAlertEmail = async ({
  toEmail,
  userName,
  spent,
  budget,
  overage,
  month,
}) => {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FBFAF8; border-radius: 16px;">
      <h2 style="color: #1F2937; margin-bottom: 8px;">Hi ${userName},</h2>
      <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
        You've gone over your monthly budget for <strong>${month}</strong>.
      </p>

      <div style="background: #FFF4EE; border: 1px solid #FFDCC9; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; color: #374151;">
          <tr>
            <td style="padding: 4px 0;">Budget</td>
            <td style="text-align: right; font-weight: 600;">₹${budget.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Spent</td>
            <td style="text-align: right; font-weight: 600;">₹${spent.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #EF4444;">Over by</td>
            <td style="text-align: right; font-weight: 700; color: #EF4444;">₹${overage.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>

      <p style="color: #6B7280; font-size: 12px; line-height: 1.6;">
        Log in to your Expense Tracker dashboard to review your spending by category
        and see if anything looks unusual.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `You've exceeded your ${month} budget`,
    html,
  });
};

module.exports = { sendBudgetAlertEmail };
