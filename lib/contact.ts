/**
 * Single source of truth for HELIOS contact details, docs/DESIGN-SPEC.md section 1.
 * No prices anywhere on the site. No Instagram link, the account is personal and deliberately
 * omitted. Update here, not per-component, if a number or address ever changes.
 */

export const PHONE_DISPLAY = "07788 930 954";
export const PHONE_E164 = "+447788930954";
export const EMAIL = "addy15@duck.com";

export const WHATSAPP_MESSAGE =
  "Hi Aditya, I'd like a free homepage mockup for my business.";

// Hard-coded to match docs/DESIGN-SPEC.md section 5 exactly (its %27-escaped apostrophe differs
// from what encodeURIComponent would produce), rather than re-encoding WHATSAPP_MESSAGE above.
export const WHATSAPP_HREF =
  "https://wa.me/447788930954?text=Hi%20Aditya%2C%20I%27d%20like%20a%20free%20homepage%20mockup%20for%20my%20business.";
export const CALL_HREF = `tel:${PHONE_E164}`;
export const EMAIL_HREF = `mailto:${EMAIL}`;
