// Shared seed data used by both the standalone prisma seed and the per-user init route.
// Keep this dependency-light (no Prisma imports) so it can be safely imported anywhere.

export type SeedCategory =
  | "BEVERAGES" | "DAIRY" | "MEAT_POULTRY" | "FRUITS_VEGETABLES" | "BAKERY"
  | "FROZEN" | "SNACKS_CONFECTIONERY" | "PERSONAL_CARE" | "HOUSEHOLD" | "BABY"
  | "PET" | "ALCOHOL" | "TOBACCO" | "DELI" | "CANNED_GOODS"
  | "PASTA_GRAINS" | "OILS_FATS" | "CONDIMENTS" | "COFFEE_TEA" | "CLEANING";

export type SeedProduct = {
  sku: string;
  name: string;
  nameAlbanian?: string;
  brand: string | null;
  category: SeedCategory;
  unit: string;
  unitSize: number;
  unitLabel: string;
  cogs: number;
  currentPrice: number;
};

export type SeedCompetitor = {
  name: string;
  nameAlbanian?: string;
  slug: string;
  hqCity: string;
  numberOfStores: number;
  pricingStrategy: "EDLP" | "HiLo" | "VALUE" | "PREMIUM" | "DISCOUNT" | "CONVENIENCE";
  description?: string;
  websiteUrl?: string;
};

export const SEED_COMPETITORS: SeedCompetitor[] = [
  { name: "Plus Market (ELKOS Group)", nameAlbanian: "Plus Market", slug: "plus-market", hqCity: "Prishtinë", numberOfStores: 48, pricingStrategy: "EDLP", description: "Zinxhiri më i madh i supermarketeve në Kosovë, pjesë e ELKOS Group.", websiteUrl: "https://plus.com.al" },
  { name: "Viva Fresh", nameAlbanian: "Viva Fresh", slug: "viva-fresh", hqCity: "Prishtinë", numberOfStores: 22, pricingStrategy: "HiLo", description: "Supermarket i orientuar drejt produkteve të freskëta.", websiteUrl: "https://vivafresh.com" },
  { name: "Proex", nameAlbanian: "Proex", slug: "proex", hqCity: "Prishtinë", numberOfStores: 18, pricingStrategy: "VALUE", description: "Zinxhir me fokus në vlerë." },
  { name: "Maxi", nameAlbanian: "Maxi", slug: "maxi", hqCity: "Prishtinë", numberOfStores: 15, pricingStrategy: "PREMIUM", description: "Supermarket premium me produkte të importuara." },
  { name: "Interex", nameAlbanian: "Interex", slug: "interex", hqCity: "Prishtinë", numberOfStores: 11, pricingStrategy: "PREMIUM", description: "Zinxhir premium me produkte të importuara nga BE." },
  { name: "Bucaj", nameAlbanian: "Bucaj", slug: "bucaj", hqCity: "Prizren", numberOfStores: 14, pricingStrategy: "DISCOUNT", description: "Supermarket me bazë në Prizren, çmime të ulëta." },
  { name: "Conad", nameAlbanian: "Conad", slug: "conad", hqCity: "Prishtinë", numberOfStores: 8, pricingStrategy: "PREMIUM", description: "Zinxhir italian premium." },
  { name: "ICA Grup", nameAlbanian: "ICA Grup", slug: "ica-grup", hqCity: "Prishtinë", numberOfStores: 31, pricingStrategy: "VALUE", description: "Zinxhir me strategji value." },
  { name: "City Market", nameAlbanian: "City Market", slug: "city-market", hqCity: "Prishtinë", numberOfStores: 12, pricingStrategy: "CONVENIENCE", description: "Dyqane konvenienti në qendra urbane." },
  { name: "Familia", nameAlbanian: "Familia", slug: "familia", hqCity: "Gjakovë", numberOfStores: 9, pricingStrategy: "VALUE", description: "Supermarket rajonal me bazë në Gjakovë." },
];

// 150+ realistic Kosovo retail products. Categories balanced — each has 5+ items.
export const SEED_PRODUCTS: SeedProduct[] = [
  // BEVERAGES (12)
  { sku: "BEV-001", name: "Coca-Cola 2L", brand: "Coca-Cola", category: "BEVERAGES", unit: "piece", unitSize: 2, unitLabel: "2L", cogs: 1.05, currentPrice: 1.50 },
  { sku: "BEV-002", name: "Pepsi 1.5L", brand: "Pepsi", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.62, currentPrice: 0.99 },
  { sku: "BEV-003", name: "Uji Rugova 1.5L", brand: "Rugova", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.21, currentPrice: 0.35 },
  { sku: "BEV-004", name: "Fanta Portokall 1.5L", brand: "Fanta", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.68, currentPrice: 0.99 },
  { sku: "BEV-005", name: "Sprite 1.5L", brand: "Sprite", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.68, currentPrice: 0.99 },
  { sku: "BEV-006", name: "Red Bull 250ml", brand: "Red Bull", category: "BEVERAGES", unit: "piece", unitSize: 0.25, unitLabel: "250ml", cogs: 1.05, currentPrice: 1.80 },
  { sku: "BEV-007", name: "Princess Energy 250ml", brand: "Princess", category: "BEVERAGES", unit: "piece", unitSize: 0.25, unitLabel: "250ml", cogs: 0.78, currentPrice: 1.29 },
  { sku: "BEV-008", name: "Uji Rugova 0.5L", brand: "Rugova", category: "BEVERAGES", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.22, currentPrice: 0.39 },
  { sku: "BEV-009", name: "Coca-Cola 0.5L", brand: "Coca-Cola", category: "BEVERAGES", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.55, currentPrice: 0.89 },
  { sku: "BEV-010", name: "Lëng portokalli Devolli 1L", brand: "Devolli", category: "BEVERAGES", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 0.95, currentPrice: 1.49 },
  { sku: "BEV-011", name: "Schweppes Tonic 1L", brand: "Schweppes", category: "BEVERAGES", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 1.05, currentPrice: 1.59 },
  { sku: "BEV-012", name: "Capri-Sun 200ml", brand: "Capri-Sun", category: "BEVERAGES", unit: "piece", unitSize: 0.2, unitLabel: "200ml", cogs: 0.28, currentPrice: 0.45 },

  // DAIRY (10)
  { sku: "DAI-001", name: "Qumësht Deva 1L", brand: "Deva", category: "DAIRY", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 0.72, currentPrice: 0.99 },
  { sku: "DAI-002", name: "Qumësht Bylmeti 1L", brand: "Bylmeti", category: "DAIRY", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 0.75, currentPrice: 1.05 },
  { sku: "DAI-003", name: "Djathë i bardhë Sharri 400g", brand: "Sharri", category: "DAIRY", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.85, currentPrice: 2.79 },
  { sku: "DAI-004", name: "Kos Activia 500g", brand: "Activia", category: "DAIRY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 1.05, currentPrice: 1.59 },
  { sku: "DAI-005", name: "Jogurt Danone 400g", brand: "Danone", category: "DAIRY", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.85, currentPrice: 1.29 },
  { sku: "DAI-006", name: "Kos Bylmeti 500g", brand: "Bylmeti", category: "DAIRY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.55, currentPrice: 0.85 },
  { sku: "DAI-007", name: "Gjalpë Sharri 200g", brand: "Sharri", category: "DAIRY", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.25, currentPrice: 1.85 },
  { sku: "DAI-008", name: "Vezë 10 copë", brand: "Bylmeti", category: "DAIRY", unit: "pack", unitSize: 10, unitLabel: "10 copë", cogs: 1.55, currentPrice: 2.29 },
  { sku: "DAI-009", name: "Djathë Olympus Feta 200g", brand: "Olympus", category: "DAIRY", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.95, currentPrice: 2.95 },
  { sku: "DAI-010", name: "Krem djathë Philadelphia 200g", brand: "Philadelphia", category: "DAIRY", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 2.20, currentPrice: 3.29 },

  // MEAT_POULTRY (8)
  { sku: "MEA-001", name: "Pulë e tërë 1kg", brand: "Pestova", category: "MEAT_POULTRY", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 2.45, currentPrice: 3.49 },
  { sku: "MEA-002", name: "Gjoks pule 1kg", brand: "Pestova", category: "MEAT_POULTRY", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 3.95, currentPrice: 5.99 },
  { sku: "MEA-003", name: "Mish viçi 1kg", brand: "Bonet", category: "MEAT_POULTRY", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 5.50, currentPrice: 7.99 },
  { sku: "MEA-004", name: "Mish derri 1kg", brand: "Bonet", category: "MEAT_POULTRY", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 4.20, currentPrice: 6.29 },
  { sku: "MEA-005", name: "Salami Milano 150g", brand: "Bonet", category: "MEAT_POULTRY", unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 1.30, currentPrice: 1.99 },
  { sku: "MEA-006", name: "Suxhuk 300g", brand: "Bonet", category: "MEAT_POULTRY", unit: "piece", unitSize: 0.3, unitLabel: "300g", cogs: 1.80, currentPrice: 2.69 },
  { sku: "MEA-007", name: "Mish qengji 1kg", brand: "Bonet", category: "MEAT_POULTRY", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 5.95, currentPrice: 8.99 },
  { sku: "MEA-008", name: "Mish i grirë viçi 500g", brand: "Bonet", category: "MEAT_POULTRY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 2.85, currentPrice: 4.29 },

  // FRUITS_VEGETABLES (10)
  { sku: "FRU-001", name: "Domate 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.62, currentPrice: 0.99 },
  { sku: "FRU-002", name: "Patate 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.42, currentPrice: 0.69 },
  { sku: "FRU-003", name: "Banane 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.95, currentPrice: 1.49 },
  { sku: "FRU-004", name: "Qepë 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.32, currentPrice: 0.59 },
  { sku: "FRU-005", name: "Mollë 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.78, currentPrice: 1.19 },
  { sku: "FRU-006", name: "Kastravec 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.55, currentPrice: 0.89 },
  { sku: "FRU-007", name: "Spec 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 1.35, currentPrice: 1.99 },
  { sku: "FRU-008", name: "Portokall 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.85, currentPrice: 1.29 },
  { sku: "FRU-009", name: "Limon 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 1.45, currentPrice: 2.19 },
  { sku: "FRU-010", name: "Karrota 1kg", brand: null, category: "FRUITS_VEGETABLES", unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.45, currentPrice: 0.69 },

  // BAKERY (6)
  { sku: "BAK-001", name: "Bukë e bardhë 500g", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.38, currentPrice: 0.55 },
  { sku: "BAK-002", name: "Bagetë franceze", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.25, unitLabel: "250g", cogs: 0.52, currentPrice: 0.79 },
  { sku: "BAK-003", name: "Bukë integrale 500g", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.52, currentPrice: 0.79 },
  { sku: "BAK-004", name: "Kroasant 80g", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.08, unitLabel: "80g", cogs: 0.32, currentPrice: 0.49 },
  { sku: "BAK-005", name: "Bukë mielli 800g", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.8, unitLabel: "800g", cogs: 0.65, currentPrice: 0.95 },
  { sku: "BAK-006", name: "Petulla me djathë 4 copë", brand: null, category: "BAKERY", unit: "pack", unitSize: 4, unitLabel: "4 copë", cogs: 1.15, currentPrice: 1.69 },

  // FROZEN (6)
  { sku: "FRZ-001", name: "Patate të ngrira McCain 1kg", brand: "McCain", category: "FROZEN", unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 1.65, currentPrice: 2.49 },
  { sku: "FRZ-002", name: "Pizza Dr. Oetker Margherita 355g", brand: "Dr. Oetker", category: "FROZEN", unit: "piece", unitSize: 0.355, unitLabel: "355g", cogs: 1.95, currentPrice: 2.99 },
  { sku: "FRZ-003", name: "Akullore Ledo Cornetto 1L", brand: "Ledo", category: "FROZEN", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 3.25, currentPrice: 4.99 },
  { sku: "FRZ-004", name: "Perime të ngrira mix 750g", brand: "McCain", category: "FROZEN", unit: "piece", unitSize: 0.75, unitLabel: "750g", cogs: 1.35, currentPrice: 1.99 },
  { sku: "FRZ-005", name: "Akullore Magnum 4-pak", brand: "Magnum", category: "FROZEN", unit: "pack", unitSize: 4, unitLabel: "4 copë", cogs: 3.95, currentPrice: 5.99 },
  { sku: "FRZ-006", name: "Peshk i ngrirë file 500g", brand: "Ledo", category: "FROZEN", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 4.50, currentPrice: 6.99 },

  // SNACKS_CONFECTIONERY (12)
  { sku: "SNK-001", name: "Lay's Çips 150g", brand: "Lay's", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 0.72, currentPrice: 1.09 },
  { sku: "SNK-002", name: "Pringles Original 165g", brand: "Pringles", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.165, unitLabel: "165g", cogs: 1.15, currentPrice: 1.69 },
  { sku: "SNK-003", name: "Doritos Nacho 150g", brand: "Doritos", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 0.95, currentPrice: 1.49 },
  { sku: "SNK-004", name: "Milka çokollatë 100g", brand: "Milka", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.1, unitLabel: "100g", cogs: 0.95, currentPrice: 1.49 },
  { sku: "SNK-005", name: "Snickers 50g", brand: "Snickers", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.05, unitLabel: "50g", cogs: 0.42, currentPrice: 0.65 },
  { sku: "SNK-006", name: "Twix 50g", brand: "Twix", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.05, unitLabel: "50g", cogs: 0.42, currentPrice: 0.65 },
  { sku: "SNK-007", name: "Mars 51g", brand: "Mars", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.051, unitLabel: "51g", cogs: 0.42, currentPrice: 0.65 },
  { sku: "SNK-008", name: "Kit Kat 4-finger 45g", brand: "Kit Kat", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.045, unitLabel: "45g", cogs: 0.45, currentPrice: 0.69 },
  { sku: "SNK-009", name: "Oreo 154g", brand: "Oreo", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.154, unitLabel: "154g", cogs: 0.95, currentPrice: 1.45 },
  { sku: "SNK-010", name: "Nutella 400g", brand: "Nutella", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 2.35, currentPrice: 3.49 },
  { sku: "SNK-011", name: "Bonbone Haribo 200g", brand: "Haribo", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.15, currentPrice: 1.79 },
  { sku: "SNK-012", name: "Çokollatë Milka Oreo 100g", brand: "Milka", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.1, unitLabel: "100g", cogs: 1.05, currentPrice: 1.59 },

  // PERSONAL_CARE (8)
  { sku: "PER-001", name: "Head & Shoulders 400ml", brand: "Head & Shoulders", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.4, unitLabel: "400ml", cogs: 2.35, currentPrice: 3.49 },
  { sku: "PER-002", name: "Pantene Pro-V 400ml", brand: "Pantene", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.4, unitLabel: "400ml", cogs: 2.55, currentPrice: 3.79 },
  { sku: "PER-003", name: "Dove sapun 90g", brand: "Dove", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.09, unitLabel: "90g", cogs: 0.62, currentPrice: 0.99 },
  { sku: "PER-004", name: "Colgate pastë dhëmbësh 100ml", brand: "Colgate", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.1, unitLabel: "100ml", cogs: 1.35, currentPrice: 1.99 },
  { sku: "PER-005", name: "Sensodyne pastë dhëmbësh 75ml", brand: "Sensodyne", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.075, unitLabel: "75ml", cogs: 2.95, currentPrice: 4.49 },
  { sku: "PER-006", name: "Nivea krem trupi 250ml", brand: "Nivea", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.25, unitLabel: "250ml", cogs: 2.45, currentPrice: 3.69 },
  { sku: "PER-007", name: "Nivea deodorant 150ml", brand: "Nivea", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.15, unitLabel: "150ml", cogs: 1.85, currentPrice: 2.79 },
  { sku: "PER-008", name: "Dove shampo 250ml", brand: "Dove", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.25, unitLabel: "250ml", cogs: 5.95, currentPrice: 8.99 },

  // HOUSEHOLD (6)
  { sku: "HOU-001", name: "Letër higjienike Zewa 4-pak", brand: "Zewa", category: "HOUSEHOLD", unit: "pack", unitSize: 4, unitLabel: "4 copë", cogs: 0.88, currentPrice: 1.29 },
  { sku: "HOU-002", name: "Letër higjienike Zewa 12-pak", brand: "Zewa", category: "HOUSEHOLD", unit: "pack", unitSize: 12, unitLabel: "12 copë", cogs: 3.50, currentPrice: 4.99 },
  { sku: "HOU-003", name: "Peceta letre Zewa 100 copë", brand: "Zewa", category: "HOUSEHOLD", unit: "pack", unitSize: 100, unitLabel: "100 copë", cogs: 1.20, currentPrice: 1.79 },
  { sku: "HOU-004", name: "Letër kuzhine Zewa 2-pak", brand: "Zewa", category: "HOUSEHOLD", unit: "pack", unitSize: 2, unitLabel: "2 rulona", cogs: 1.45, currentPrice: 2.19 },
  { sku: "HOU-005", name: "Folie alumini 30m", brand: "Fino", category: "HOUSEHOLD", unit: "piece", unitSize: 30, unitLabel: "30m", cogs: 1.95, currentPrice: 2.99 },
  { sku: "HOU-006", name: "Qese mbeturinash 50L 20 copë", brand: "Fino", category: "HOUSEHOLD", unit: "pack", unitSize: 20, unitLabel: "20 copë", cogs: 2.15, currentPrice: 3.29 },

  // BABY (5)
  { sku: "BAB-001", name: "Pampers Active Baby 3 (54 copë)", brand: "Pampers", category: "BABY", unit: "pack", unitSize: 54, unitLabel: "54 copë", cogs: 7.95, currentPrice: 11.99 },
  { sku: "BAB-002", name: "Huggies Elite Soft 4 (44 copë)", brand: "Huggies", category: "BABY", unit: "pack", unitSize: 44, unitLabel: "44 copë", cogs: 8.45, currentPrice: 12.99 },
  { sku: "BAB-003", name: "Hipp ushqim fëmijësh 190g", brand: "Hipp", category: "BABY", unit: "piece", unitSize: 0.19, unitLabel: "190g", cogs: 1.05, currentPrice: 1.49 },
  { sku: "BAB-004", name: "Pampers peceta të lagura 80 copë", brand: "Pampers", category: "BABY", unit: "pack", unitSize: 80, unitLabel: "80 copë", cogs: 3.20, currentPrice: 4.99 },
  { sku: "BAB-005", name: "Pampers Premium Care 5 (44 copë)", brand: "Pampers", category: "BABY", unit: "pack", unitSize: 44, unitLabel: "44 copë", cogs: 12.50, currentPrice: 18.99 },

  // PET (5)
  { sku: "PET-001", name: "Whiskas ushqim mace 1.4kg", brand: "Whiskas", category: "PET", unit: "piece", unitSize: 1.4, unitLabel: "1.4kg", cogs: 3.25, currentPrice: 4.99 },
  { sku: "PET-002", name: "Pedigree ushqim qen 15kg", brand: "Pedigree", category: "PET", unit: "piece", unitSize: 15, unitLabel: "15kg", cogs: 12.50, currentPrice: 18.99 },
  { sku: "PET-003", name: "Whiskas konservë 400g", brand: "Whiskas", category: "PET", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.55, currentPrice: 2.49 },
  { sku: "PET-004", name: "Pedigree konservë 400g", brand: "Pedigree", category: "PET", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.65, currentPrice: 2.59 },
  { sku: "PET-005", name: "Whiskas ushqim mace 3kg", brand: "Whiskas", category: "PET", unit: "piece", unitSize: 3, unitLabel: "3kg", cogs: 6.50, currentPrice: 9.99 },

  // ALCOHOL (8)
  { sku: "ALC-001", name: "Birra Peja 500ml", brand: "Peja", category: "ALCOHOL", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.42, currentPrice: 0.69 },
  { sku: "ALC-002", name: "Birra Korça 500ml", brand: "Korça", category: "ALCOHOL", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.45, currentPrice: 0.75 },
  { sku: "ALC-003", name: "Birra Heineken 500ml", brand: "Heineken", category: "ALCOHOL", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.75, currentPrice: 1.19 },
  { sku: "ALC-004", name: "Stella Artois 500ml", brand: "Stella Artois", category: "ALCOHOL", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.85, currentPrice: 1.29 },
  { sku: "ALC-005", name: "Verë Stone Castle Merlot 750ml", brand: "Stone Castle", category: "ALCOHOL", unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 3.25, currentPrice: 4.99 },
  { sku: "ALC-006", name: "Verë Suhareka Vranac 750ml", brand: "Suhareka", category: "ALCOHOL", unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 3.95, currentPrice: 5.99 },
  { sku: "ALC-007", name: "Rakia Sharri 700ml", brand: "Sharri", category: "ALCOHOL", unit: "piece", unitSize: 0.7, unitLabel: "700ml", cogs: 6.50, currentPrice: 9.99 },
  { sku: "ALC-008", name: "Vodka Absolut 700ml", brand: "Absolut", category: "ALCOHOL", unit: "piece", unitSize: 0.7, unitLabel: "700ml", cogs: 16.50, currentPrice: 24.99 },

  // TOBACCO (5)
  { sku: "TOB-001", name: "Marlboro Red 20 copë", brand: "Marlboro", category: "TOBACCO", unit: "pack", unitSize: 20, unitLabel: "20 copë", cogs: 2.45, currentPrice: 3.50 },
  { sku: "TOB-002", name: "Marlboro Gold 20 copë", brand: "Marlboro", category: "TOBACCO", unit: "pack", unitSize: 20, unitLabel: "20 copë", cogs: 2.45, currentPrice: 3.50 },
  { sku: "TOB-003", name: "L&M Red 20 copë", brand: "L&M", category: "TOBACCO", unit: "pack", unitSize: 20, unitLabel: "20 copë", cogs: 1.95, currentPrice: 2.80 },
  { sku: "TOB-004", name: "L&M Blue 20 copë", brand: "L&M", category: "TOBACCO", unit: "pack", unitSize: 20, unitLabel: "20 copë", cogs: 1.95, currentPrice: 2.80 },
  { sku: "TOB-005", name: "Karelia Slims 20 copë", brand: "Karelia", category: "TOBACCO", unit: "pack", unitSize: 20, unitLabel: "20 copë", cogs: 1.75, currentPrice: 2.50 },

  // DELI (5)
  { sku: "DEL-001", name: "Proshutë e tymosur 150g", brand: "Bonet", category: "DELI", unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 1.95, currentPrice: 2.99 },
  { sku: "DEL-002", name: "Djathë Gouda i prerë 200g", brand: "Olympus", category: "DELI", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 2.55, currentPrice: 3.79 },
  { sku: "DEL-003", name: "Olive të zeza 200g", brand: "Olympus", category: "DELI", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.25, currentPrice: 1.99 },
  { sku: "DEL-004", name: "Salam i tymosur 200g", brand: "Bonet", category: "DELI", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 2.25, currentPrice: 3.49 },
  { sku: "DEL-005", name: "Djathë Parmezan 100g", brand: "Olympus", category: "DELI", unit: "piece", unitSize: 0.1, unitLabel: "100g", cogs: 3.25, currentPrice: 4.99 },

  // CANNED_GOODS (6)
  { sku: "CAN-001", name: "Ton Rio Mare 160g", brand: "Rio Mare", category: "CANNED_GOODS", unit: "piece", unitSize: 0.16, unitLabel: "160g", cogs: 1.25, currentPrice: 1.85 },
  { sku: "CAN-002", name: "Ton Calvo 160g", brand: "Calvo", category: "CANNED_GOODS", unit: "piece", unitSize: 0.16, unitLabel: "160g", cogs: 1.05, currentPrice: 1.59 },
  { sku: "CAN-003", name: "Fasule e kuqe 400g", brand: "Pestova", category: "CANNED_GOODS", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.52, currentPrice: 0.79 },
  { sku: "CAN-004", name: "Salcë domatesh Pestova 400g", brand: "Pestova", category: "CANNED_GOODS", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.72, currentPrice: 1.09 },
  { sku: "CAN-005", name: "Misër i konservuar 340g", brand: "Pestova", category: "CANNED_GOODS", unit: "piece", unitSize: 0.34, unitLabel: "340g", cogs: 0.55, currentPrice: 0.85 },
  { sku: "CAN-006", name: "Bishtaja 720ml", brand: "Pestova", category: "CANNED_GOODS", unit: "piece", unitSize: 0.72, unitLabel: "720ml", cogs: 1.95, currentPrice: 2.99 },

  // PASTA_GRAINS (7)
  { sku: "PAS-001", name: "Makarona Barilla 500g", brand: "Barilla", category: "PASTA_GRAINS", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.62, currentPrice: 0.99 },
  { sku: "PAS-002", name: "Makarona Divella 500g", brand: "Divella", category: "PASTA_GRAINS", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.58, currentPrice: 0.89 },
  { sku: "PAS-003", name: "Oriz Basmati 1kg", brand: "Princess", category: "PASTA_GRAINS", unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 1.85, currentPrice: 2.79 },
  { sku: "PAS-004", name: "Miell gruri 1kg", brand: "Pestova", category: "PASTA_GRAINS", unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 0.48, currentPrice: 0.95 },
  { sku: "PAS-005", name: "Makarona Penne Barilla 500g", brand: "Barilla", category: "PASTA_GRAINS", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.62, currentPrice: 0.99 },
  { sku: "PAS-006", name: "Oriz i bardhë 1kg", brand: "Pestova", category: "PASTA_GRAINS", unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 0.95, currentPrice: 1.49 },
  { sku: "PAS-007", name: "Miell misri 1kg", brand: "Pestova", category: "PASTA_GRAINS", unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 2.55, currentPrice: 3.99 },

  // OILS_FATS (5)
  { sku: "OIL-001", name: "Vaj luledielli Bona 1L", brand: "Bona", category: "OILS_FATS", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 1.42, currentPrice: 1.99 },
  { sku: "OIL-002", name: "Vaj ulliri ekstra 750ml", brand: "Bertolli", category: "OILS_FATS", unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 4.50, currentPrice: 6.99 },
  { sku: "OIL-003", name: "Margarine Rama 500g", brand: "Rama", category: "OILS_FATS", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 1.45, currentPrice: 2.19 },
  { sku: "OIL-004", name: "Vaj luledielli Bona 5L", brand: "Bona", category: "OILS_FATS", unit: "piece", unitSize: 5, unitLabel: "5L", cogs: 5.95, currentPrice: 8.99 },
  { sku: "OIL-005", name: "Vaj ulliri Olympus 500ml", brand: "Olympus", category: "OILS_FATS", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 3.20, currentPrice: 4.99 },

  // CONDIMENTS (6)
  { sku: "CON-001", name: "Ketchup Heinz 570g", brand: "Heinz", category: "CONDIMENTS", unit: "piece", unitSize: 0.57, unitLabel: "570g", cogs: 1.55, currentPrice: 2.29 },
  { sku: "CON-002", name: "Majonezë Hellmann's 400g", brand: "Hellmann's", category: "CONDIMENTS", unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.55, currentPrice: 2.29 },
  { sku: "CON-003", name: "Mustardë 255g", brand: "Heinz", category: "CONDIMENTS", unit: "piece", unitSize: 0.255, unitLabel: "255g", cogs: 0.95, currentPrice: 1.49 },
  { sku: "CON-004", name: "Uthull molle 500ml", brand: "Pestova", category: "CONDIMENTS", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.65, currentPrice: 0.99 },
  { sku: "CON-005", name: "Kripë e jodizuar 1kg", brand: "Pestova", category: "CONDIMENTS", unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 0.42, currentPrice: 0.69 },
  { sku: "CON-006", name: "Ketchup Heinz Hot 570g", brand: "Heinz", category: "CONDIMENTS", unit: "piece", unitSize: 0.57, unitLabel: "570g", cogs: 2.25, currentPrice: 3.49 },

  // COFFEE_TEA (6)
  { sku: "COF-001", name: "Kafe Bona 250g", brand: "Bona", category: "COFFEE_TEA", unit: "piece", unitSize: 0.25, unitLabel: "250g", cogs: 2.15, currentPrice: 3.19 },
  { sku: "COF-002", name: "Nescafé Classic 200g", brand: "Nescafé", category: "COFFEE_TEA", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 3.25, currentPrice: 4.89 },
  { sku: "COF-003", name: "Çaj Lipton 25 filtra", brand: "Lipton", category: "COFFEE_TEA", unit: "piece", unitSize: 25, unitLabel: "25 filtra", cogs: 0.95, currentPrice: 1.49 },
  { sku: "COF-004", name: "Kafe Lavazza Qualita Oro 250g", brand: "Lavazza", category: "COFFEE_TEA", unit: "piece", unitSize: 0.25, unitLabel: "250g", cogs: 5.20, currentPrice: 7.99 },
  { sku: "COF-005", name: "Nescafé Gold 200g", brand: "Nescafé", category: "COFFEE_TEA", unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 4.50, currentPrice: 6.79 },
  { sku: "COF-006", name: "Çaj Lipton Limon 25 filtra", brand: "Lipton", category: "COFFEE_TEA", unit: "piece", unitSize: 25, unitLabel: "25 filtra", cogs: 1.05, currentPrice: 1.59 },

  // CLEANING (6)
  { sku: "CLE-001", name: "Ariel pluhur 3kg", brand: "Ariel", category: "CLEANING", unit: "piece", unitSize: 3, unitLabel: "3kg", cogs: 4.20, currentPrice: 5.99 },
  { sku: "CLE-002", name: "Persil pluhur 4.5kg", brand: "Persil", category: "CLEANING", unit: "piece", unitSize: 4.5, unitLabel: "4.5kg", cogs: 5.20, currentPrice: 7.99 },
  { sku: "CLE-003", name: "Cif krem 500ml", brand: "Cif", category: "CLEANING", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 1.55, currentPrice: 2.29 },
  { sku: "CLE-004", name: "Fairy 750ml", brand: "Fairy", category: "CLEANING", unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 1.05, currentPrice: 1.59 },
  { sku: "CLE-005", name: "Ariel kapsula 32 copë", brand: "Ariel", category: "CLEANING", unit: "pack", unitSize: 32, unitLabel: "32 copë", cogs: 4.95, currentPrice: 7.49 },
  { sku: "CLE-006", name: "Domestos 750ml", brand: "Domestos", category: "CLEANING", unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 1.05, currentPrice: 1.49 },

  // Extra fills to push above 150
  { sku: "BEV-013", name: "Sprite 0.5L", brand: "Sprite", category: "BEVERAGES", unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.55, currentPrice: 0.89 },
  { sku: "BEV-014", name: "Princess Cola 1.5L", brand: "Princess", category: "BEVERAGES", unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.55, currentPrice: 0.85 },
  { sku: "DAI-011", name: "Qumësht me çokollatë 200ml", brand: "Bylmeti", category: "DAIRY", unit: "piece", unitSize: 0.2, unitLabel: "200ml", cogs: 0.42, currentPrice: 0.65 },
  { sku: "SNK-013", name: "Çips Doritos Cool 150g", brand: "Doritos", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 0.95, currentPrice: 1.49 },
  { sku: "SNK-014", name: "Wafer Knoppers 25g", brand: "Knoppers", category: "SNACKS_CONFECTIONERY", unit: "piece", unitSize: 0.025, unitLabel: "25g", cogs: 0.35, currentPrice: 0.55 },
  { sku: "BAK-007", name: "Buke tosti 500g", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.95, currentPrice: 1.45 },
  { sku: "BAK-008", name: "Simite 100g", brand: null, category: "BAKERY", unit: "piece", unitSize: 0.1, unitLabel: "100g", cogs: 0.18, currentPrice: 0.29 },
  { sku: "CON-007", name: "Sojë sos 250ml", brand: "Heinz", category: "CONDIMENTS", unit: "piece", unitSize: 0.25, unitLabel: "250ml", cogs: 1.05, currentPrice: 1.59 },
  { sku: "HOU-007", name: "Sapun enësh 1L", brand: "Fairy", category: "HOUSEHOLD", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 1.55, currentPrice: 2.29 },
  { sku: "FRZ-007", name: "Akullore vanilje 1L", brand: "Ledo", category: "FROZEN", unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 2.15, currentPrice: 3.29 },
  { sku: "PER-009", name: "Pasta dhëmbësh Sensodyne Fresh 75ml", brand: "Sensodyne", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.075, unitLabel: "75ml", cogs: 2.95, currentPrice: 4.49 },
  { sku: "PER-010", name: "Nivea krem fytyre 50ml", brand: "Nivea", category: "PERSONAL_CARE", unit: "piece", unitSize: 0.05, unitLabel: "50ml", cogs: 2.75, currentPrice: 4.19 },
];

export const SEED_STORES = [
  { name: "Qendra Prishtinë", city: "Prishtinë", region: "PRISHTINA" as const, address: "Rr. Nënë Tereza 24", storeType: "SUPERMARKET" as const, salesFloorM2: 2400 },
  { name: "Dardania", city: "Prishtinë", region: "PRISHTINA" as const, address: "Lagjja Dardania, B.11", storeType: "SUPERMARKET" as const, salesFloorM2: 1800 },
  { name: "Prizren", city: "Prizren", region: "PRIZREN" as const, address: "Rr. Remzi Ademaj 8", storeType: "SUPERMARKET" as const, salesFloorM2: 1600 },
  { name: "Pejë", city: "Pejë", region: "PEJA" as const, address: "Rr. Mbretëresha Teuta 5", storeType: "SUPERMARKET" as const, salesFloorM2: 1200 },
  { name: "Gjakovë", city: "Gjakovë", region: "GJAKOVA" as const, address: "Sheshi Ismail Qemali 1", storeType: "SUPERMARKET" as const, salesFloorM2: 1350 },
];

// Helper: random integer in [min, max] inclusive
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: pick N random unique items from array
export function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// Build 60-day competitor price series with strategy-based bias, drift, promos.
export function buildCompetitorPriceSeries(
  ourPrice: number,
  strategy: string,
  competitorProductId: string,
): Array<{ competitorProductId: string; price: number; isInStock: boolean; isOnPromotion: boolean; promotionalPrice: number | null; source: "MANUAL"; recordedAt: Date }> {
  // Base bias by strategy
  let basePrice: number;
  switch (strategy) {
    case "PREMIUM":
      basePrice = ourPrice * (1.04 + Math.random() * 0.08);
      break;
    case "DISCOUNT":
      basePrice = ourPrice * (0.88 + Math.random() * 0.06);
      break;
    case "EDLP":
      basePrice = ourPrice * (0.96 + Math.random() * 0.06);
      break;
    case "HiLo":
      basePrice = Math.random() < 0.5 ? ourPrice * 0.90 : ourPrice * 1.05;
      break;
    case "CONVENIENCE":
      basePrice = ourPrice * (1.02 + Math.random() * 0.06);
      break;
    case "VALUE":
    default:
      basePrice = ourPrice * (0.94 + Math.random() * 0.08);
      break;
  }

  const out = [];
  let runningPrice = basePrice;
  let promoDaysLeft = 0;
  let promoPrice = 0;

  for (let day = 59; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(8, 0, 0, 0);

    // Day-to-day drift ±3%
    runningPrice = runningPrice * (1 + (Math.random() - 0.5) * 0.06);
    // Anchor back toward base price so it doesn't wander far
    runningPrice = runningPrice * 0.85 + basePrice * 0.15;

    // Roughly every 7-10 days, start a promo
    let isOnPromotion = false;
    let finalPromoPrice: number | null = null;
    if (promoDaysLeft > 0) {
      isOnPromotion = true;
      finalPromoPrice = promoPrice;
      promoDaysLeft--;
    } else if (Math.random() < 1 / 8) {
      const discount = 0.15 + Math.random() * 0.10;
      promoPrice = parseFloat((runningPrice * (1 - discount)).toFixed(2));
      promoDaysLeft = 2 + Math.floor(Math.random() * 3);
      isOnPromotion = true;
      finalPromoPrice = promoPrice;
      promoDaysLeft--;
    }

    out.push({
      competitorProductId,
      price: parseFloat(Math.max(0.05, runningPrice).toFixed(2)),
      isInStock: Math.random() > 0.05,
      isOnPromotion,
      promotionalPrice: finalPromoPrice,
      source: "MANUAL" as const,
      recordedAt: date,
    });
  }
  return out;
}

// Build 60-day our-price history: mostly stable with 1-2 step changes.
export function buildOwnPriceSeries(
  productId: string,
  currentPrice: number,
  cogs: number,
  storeId: string | null,
): Array<{ productId: string; storeId: string | null; price: number; cogs: number; margin: number; recordedAt: Date }> {
  const out = [];
  // Decide on 1-2 historical price points
  const changeCount = Math.random() < 0.5 ? 1 : 2;
  const changeDays = Array.from({ length: changeCount }, () => Math.floor(Math.random() * 50) + 5).sort((a, b) => b - a);
  const startPrice = parseFloat((currentPrice * (0.93 + Math.random() * 0.05)).toFixed(2));
  const midPrice = changeCount === 2 ? parseFloat(((startPrice + currentPrice) / 2).toFixed(2)) : currentPrice;

  for (let day = 59; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(6, 0, 0, 0);

    let price: number;
    if (changeCount === 1) {
      price = day > changeDays[0] ? startPrice : currentPrice;
    } else {
      if (day > changeDays[0]) price = startPrice;
      else if (day > changeDays[1]) price = midPrice;
      else price = currentPrice;
    }
    const margin = ((price - cogs) / price) * 100;
    out.push({
      productId,
      storeId,
      price,
      cogs,
      margin: parseFloat(margin.toFixed(2)),
      recordedAt: date,
    });
  }
  return out;
}

// Estimate a daily unit volume by category — used for revenue delta calc.
export function dailyVolumeForCategory(category: SeedCategory): number {
  const ranges: Record<SeedCategory, [number, number]> = {
    BEVERAGES: [80, 150],
    DAIRY: [70, 140],
    BAKERY: [100, 200],
    FRUITS_VEGETABLES: [90, 180],
    MEAT_POULTRY: [40, 80],
    SNACKS_CONFECTIONERY: [60, 120],
    PASTA_GRAINS: [50, 100],
    OILS_FATS: [30, 60],
    CONDIMENTS: [30, 60],
    CANNED_GOODS: [40, 80],
    COFFEE_TEA: [40, 90],
    DELI: [30, 70],
    FROZEN: [35, 70],
    PERSONAL_CARE: [25, 60],
    HOUSEHOLD: [30, 70],
    CLEANING: [25, 55],
    BABY: [15, 40],
    PET: [15, 35],
    ALCOHOL: [30, 80],
    TOBACCO: [50, 120],
  };
  const [lo, hi] = ranges[category];
  return randInt(lo, hi);
}
