// Two labelled sample notices for the demo ("Try a sample"). Written for Cleared, not copied from PayPal.
export const SAMPLE_NOTICES = {
  genuine: {
    label: "A real limitation notice",
    rc: "yes" as const,
    text: `From: service@paypal.com
Subject: Your account access has been limited

Hello Ada Okafor,

We noticed a recent change in your selling activity, and we need a little more information to understand your business. Until we review it, you can't send or withdraw money.

Please log in to your account and go to the Resolution Center within 10 days. Upload:
- Invoices or receipts for your recent sales
- Proof of delivery for the work your customers paid for
- A short description of your business model and your website or portfolio

Once we've reviewed this information, we'll email you about your account status.

Sincerely,
PayPal`,
  },
  phishing: {
    label: "A fake “PayPal” email",
    rc: "no" as const,
    text: `From: PayPal Security <support@paypal-account-review.net>
Subject: FINAL NOTICE: your account will be permanently suspended

Dear Customer,

We detected unusual activity and your funds of $400.00 are on hold. To avoid permanent suspension you must verify your account within 24 hours.

Click here to confirm your identity: https://paypal-account-review.net/verify
You will need your password and the one-time code we text you. A $25 unlock fee is required to release the funds.

PayPal Team`,
  },
} as const;
