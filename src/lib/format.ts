export function formatMZN(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return `MZN ${(n || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function phoneToEmail(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  return `${clean}@streamcash.local`;
}

export function emailToPhone(email: string): string {
  return email.replace("@streamcash.local", "");
}
