import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR") {
  const symbol = currency === "EUR" ? "€" : currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("sq-AL").format(value);
}

export function calcMargin(price: number, cogs: number): number {
  if (price === 0) return 0;
  return ((price - cogs) / price) * 100;
}

export function calcPrice(cogs: number, marginPct: number): number {
  if (marginPct >= 100) return cogs * 10;
  return cogs / (1 - marginPct / 100);
}

export function getMarginColor(margin: number): string {
  if (margin < 3) return "text-red-500";
  if (margin < 8) return "text-yellow-500";
  if (margin < 15) return "text-green-500";
  return "text-emerald-500";
}

export function getMarginBg(margin: number): string {
  if (margin < 3) return "bg-red-500/10 border-red-500/20";
  if (margin < 8) return "bg-yellow-500/10 border-yellow-500/20";
  if (margin < 15) return "bg-green-500/10 border-green-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}

export function getPriceDelta(
  yourPrice: number,
  competitorPrice: number
): { pct: number; label: string; color: string } {
  const pct = ((yourPrice - competitorPrice) / competitorPrice) * 100;
  if (pct > 5) return { pct, label: "Shtrenjtë", color: "text-red-400" };
  if (pct < -5) return { pct, label: "Lirë", color: "text-green-400" };
  return { pct, label: "Konkurrues", color: "text-yellow-400" };
}

export function regionLabel(region: string): string {
  const labels: Record<string, string> = {
    PRISHTINA: "Prishtinë",
    PRIZREN: "Prizren",
    FERIZAJ: "Ferizaj",
    PEJA: "Pejë",
    GJAKOVA: "Gjakovë",
    GJILAN: "Gjilan",
    MITROVICA: "Mitrovicë",
    VUSHTRRI: "Vushtrri",
    LIPJAN: "Lipjan",
    SUHAREKA: "Suharekë",
    RAHOVEC: "Rahovec",
    MALISHEVA: "Malishevë",
    KAMENICA: "Kamenicë",
    VITI: "Viti",
    DECAN: "Deçan",
    ISTOG: "Istog",
    KLINE: "Klinë",
    SKENDERAJ: "Skënderaj",
  };
  return labels[region] ?? region;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    BEVERAGES: "Pije",
    DAIRY: "Bulmet",
    MEAT_POULTRY: "Mish & Shpezë",
    FRUITS_VEGETABLES: "Fruta & Perime",
    BAKERY: "Bukëpjekje",
    FROZEN: "Të ngrira",
    SNACKS_CONFECTIONERY: "Ëmbëlsira",
    PERSONAL_CARE: "Kujdesi personal",
    HOUSEHOLD: "Shtëpiake",
    BABY: "Fëmijë",
    PET: "Kafshë shtëpiake",
    ALCOHOL: "Alkool",
    TOBACCO: "Duhan",
    DELI: "Delikatesë",
    CANNED_GOODS: "Konserva",
    PASTA_GRAINS: "Makarona & Drithëra",
    OILS_FATS: "Vaj & Yndyrna",
    CONDIMENTS: "Erëza",
    COFFEE_TEA: "Kafe & Çaj",
    CLEANING: "Pastrimi",
  };
  return labels[category] ?? category;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Tani";
  if (diffMin < 60) return `${diffMin} min më parë`;
  if (diffHr < 24) return `${diffHr} orë më parë`;
  if (diffDay < 7) return `${diffDay} ditë më parë`;
  return d.toLocaleDateString("sq-AL");
}
