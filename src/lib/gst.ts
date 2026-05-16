// GST calculation helpers (India)
export type GstType = "intra" | "inter" | "none";

export type LineItem = {
  description: string;
  hsn_sac?: string;
  quantity: number;
  unit?: string;
  rate: number;
  tax_rate: number; // percent (0, 5, 12, 18, 28)
};

export type GstTotals = {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
};

export const calcGst = (
  items: LineItem[],
  gstType: GstType,
  discount = 0
): GstTotals => {
  let subtotal = 0;
  let totalTax = 0;
  for (const it of items) {
    const lineAmount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
    subtotal += lineAmount;
    totalTax += (lineAmount * (Number(it.tax_rate) || 0)) / 100;
  }
  const afterDiscount = Math.max(0, subtotal - (Number(discount) || 0));
  const taxOnDiscounted = subtotal > 0 ? totalTax * (afterDiscount / subtotal) : 0;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (gstType === "intra") {
    cgst = taxOnDiscounted / 2;
    sgst = taxOnDiscounted / 2;
  } else if (gstType === "inter") {
    igst = taxOnDiscounted;
  }

  const tax = cgst + sgst + igst;
  const total = afterDiscount + tax;

  return {
    subtotal: round2(subtotal),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    tax: round2(tax),
    total: round2(total),
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
