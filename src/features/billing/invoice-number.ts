/** Pure invoice number formatter — DB lookup lives in `nextInvoiceNumber`. */
export function formatInvoiceNumber(year: number, sequence: number) {
  const safeSeq = Number.isFinite(sequence) && sequence > 0 ? sequence : 1;
  return `INV-${year}-${String(safeSeq).padStart(4, "0")}`;
}

export function parseInvoiceSequence(
  invoiceNumber: string,
  year: number,
): number {
  const prefix = `INV-${year}-`;
  if (!invoiceNumber.startsWith(prefix)) {
    return 0;
  }
  const seq = Number(invoiceNumber.slice(prefix.length));
  return Number.isFinite(seq) ? seq : 0;
}

export function nextInvoiceSequence(
  year: number,
  latestInvoiceNumber: string | null | undefined,
) {
  const lastSeq = latestInvoiceNumber
    ? parseInvoiceSequence(latestInvoiceNumber, year)
    : 0;
  return formatInvoiceNumber(year, lastSeq + 1);
}
