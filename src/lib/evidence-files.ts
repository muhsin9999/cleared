// PayPal's limits for dispute evidence (docs/PAYPAL.md §5): JPG, GIF, PNG or PDF, at most 10 MB each, 50 MB per case.
export const EVIDENCE_TYPES = { "image/jpeg": "JPG", "image/png": "PNG", "image/gif": "GIF", "application/pdf": "PDF" } as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CASE_BYTES = 50 * 1024 * 1024;

export function checkEvidenceFile(file: { type: string; size: number }) {
  if (!(file.type in EVIDENCE_TYPES)) return "PayPal only accepts JPG, PNG, GIF or PDF files as evidence.";
  if (file.size > MAX_FILE_BYTES) return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. PayPal’s limit is 10 MB per file.`;
  if (file.size === 0) return "That file is empty.";
  return null;
}
