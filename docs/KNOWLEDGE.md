# PayPal policy knowledge base

This file is the source for `knowledge/` and is cited by Cleared's AI. Rules paraphrase PayPal's public help pages, checked 19 Oct 2026. **Re-verify before the demo; PayPal edits these pages.**

## Holds on new sellers: [HELP848](https://www.paypal.com/us/cshelp/article/HELP848)

- **K1.** New sellers, and sellers returning after a gap, may have initial payments held for **up to 21 days** to cover possible buyer complaints.
- **K2.** PayPal reviews monthly whether proceeds can be released immediately. Positive selling history and confirmed identity speed this up.
- **K3.** Factors for an instant-release limit:
  - a confirmed bank account or card;
  - a confirmed mobile phone set as primary;
  - a set number of sales and sales amount;
  - **no disputes** for a set period;
  - no active limitation.

  You can ask for an increase every 30 days.

## Releasing held payments: [help129](https://www.paypal.com/us/cshelp/article/help129)

- **K4.** **Goods:** add tracking from an approved carrier, or use a PayPal label. The hold releases about **24 hours after the carrier confirms delivery**.
- **K5.** **Services or intangible items:** mark the order **Completed**. The hold releases **7 days later**.
- **K6.** PayPal may still hold for up to 21 days if selling patterns change unusually.
- **K7.** Path: Activity → the payment → "Get your money" → Product / "Service or virtual product" → Submit.

## Limitations: [help534](https://www.paypal.com/us/cshelp/article/why-is-my-paypal-account-limited-help534), [HELP535](https://www.paypal.com/ux/smarthelp/article/HELP535)

- **K8.** Causes PayPal lists:
  - regulatory requirements;
  - Acceptable Use Policy violations;
  - unauthorized use;
  - **higher-risk activity**, such as many claims or chargebacks, a **new product category**, or a **sudden sales spike**;
  - inactivity.
- **K9.** Resolve it through the Resolution Center or the Dashboard notification steps (for example, uploading ID). Phone support usually can't lift it. PayPal typically responds within about three business days ([BRC](https://paypal.com/hk/brc/article/business-account-limitations)).
- **K10.** **Phishing:** if a limitation email doesn't appear in the Resolution Center, forward it to **phishing@paypal.com**.

## 180-day hold: [pcc191](https://www.paypal.com/us/cshelp/article/were-unable-to-continue-offering-our-services-pcc191)

- **K11.** When PayPal ends service, the balance is held **180 days** from the limitation date. The decision "can't be overturned." The seller can still log in and refund buyers. **Prevention is the only real defence.**

## Reserves: [BRC account reserves](https://www.paypal.com/us/brc/article/account-reserves), [HELP393](https://www.paypal.com/cshelp/article/what-are-reserves-HELP393)

- **K12.** Two kinds:
  - **Rolling:** a percentage held for a period, for example 10% for 90 days.
  - **Minimum:** a fixed balance.
- **K13.** Factors PayPal weighs:
  - processing history;
  - industry;
  - claim and dispute volume;
  - credit history;
  - **preselling**;
  - **extended delivery timeframes**.

  Reviewed at least every 180 days.
- **K14.** PayPal's advice:
  - ship promptly with valid tracking;
  - communicate early;
  - **keep complaint rates under 1% of sales**;
  - refund promptly.

## Disputes and Seller Protection

- **K15.** Respond to a dispute within **10 days** of creation, or an escalated claim is decided for the buyer. Use the API's `seller_response_due_date` as the actual deadline.
- **K16.** US Seller Protection: tangible goods, shipped to the transaction-page address, no redirect, and **signature confirmation at $750 or more**. Digital goods and services are generally not covered, so **for services, the proof is everything**. (Secondary source: competitor pages quoting PayPal's Seller Protection terms, version 2026-01-26. Verify against the PayPal legal page.)
- **K17.** `seller_protection.status=ELIGIBLE` in the Orders API reflects declared data only.

**Unverified (never cite as PayPal rules):** "a 2–4% dispute rate triggers reserves"; "electronics, gift cards and tickets get extra scrutiny."
