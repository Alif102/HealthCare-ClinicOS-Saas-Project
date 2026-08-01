import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  formatInvoiceNumber,
  nextInvoiceSequence,
  parseInvoiceSequence,
} from "@/features/billing/invoice-number";
import {
  decimalToInput,
  formatMoney,
  sumDecimals,
  toDecimal,
  amountPaidFromPayments,
} from "@/features/billing/money";

describe("formatMoney", () => {
  it("formats Decimal values", () => {
    expect(formatMoney(new Prisma.Decimal("75.5"))).toBe("$75.50");
  });

  it("returns em dash for non-finite input", () => {
    expect(formatMoney(Number.NaN)).toBe("—");
  });
});

describe("decimal helpers", () => {
  it("round-trips input strings", () => {
    expect(decimalToInput(toDecimal("12.3"))).toBe("12.30");
  });

  it("sums Decimal arrays", () => {
    const total = sumDecimals([toDecimal("10"), toDecimal("2.25")]);
    expect(total.toString()).toBe("12.25");
  });
});

describe("invoice numbers", () => {
  it("pads sequences", () => {
    expect(formatInvoiceNumber(2026, 7)).toBe("INV-2026-0007");
  });

  it("parses sequences from the current year prefix", () => {
    expect(parseInvoiceSequence("INV-2026-0042", 2026)).toBe(42);
    expect(parseInvoiceSequence("INV-2025-0042", 2026)).toBe(0);
  });

  it("increments from the latest number", () => {
    expect(nextInvoiceSequence(2026, "INV-2026-0003")).toBe("INV-2026-0004");
    expect(nextInvoiceSequence(2026, null)).toBe("INV-2026-0001");
  });
});

describe("amountPaidFromPayments", () => {
  it("sums payment amounts", () => {
    const total = amountPaidFromPayments([
      { amount: toDecimal("40") },
      { amount: toDecimal("10.5") },
    ]);
    expect(total.toString()).toBe("50.5");
  });
});
