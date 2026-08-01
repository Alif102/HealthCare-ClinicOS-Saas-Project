import { Prisma } from "@prisma/client";

/** Format a Decimal / number / string as currency display (e.g. 75.00). */
export function formatMoney(
  value: Prisma.Decimal | number | string,
  currency = "USD",
) {
  const amount =
    value instanceof Prisma.Decimal
      ? value.toNumber()
      : typeof value === "string"
        ? Number(value)
        : value;

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function toDecimal(value: string | number) {
  return new Prisma.Decimal(value);
}

export function decimalToInput(value: Prisma.Decimal | number | string) {
  if (value instanceof Prisma.Decimal) {
    return value.toFixed(2);
  }
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function sumDecimals(values: Prisma.Decimal[]) {
  return values.reduce(
    (acc, value) => acc.add(value),
    new Prisma.Decimal(0),
  );
}

export function amountPaidFromPayments(
  payments: { amount: { toString(): string } }[],
) {
  return sumDecimals(
    payments.map((payment) => toDecimal(payment.amount.toString())),
  );
}
