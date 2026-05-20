import { PrismaClient, ProductCategory, KosovoRegion, StoreType, PriceSource, AlertType, AlertSeverity, UserRole } from "@prisma/client";
import { optimizeMargin } from "../src/lib/margin-engine";

const prisma = new PrismaClient();

const COMPETITORS = [
  {
    name: "Plus Market (ELKOS Group)",
    nameAlbanian: "Plus Market",
    slug: "plus-market",
    hqCity: "Prishtinë",
    numberOfStores: 48,
    pricingStrategy: "EDLP",
    description: "Zinxhiri më i madh i supermarketeve në Kosovë, pjesë e ELKOS Group. Strategjia EDLP (çmime të ulëta çdo ditë).",
    websiteUrl: "https://plus.com.al",
  },
  {
    name: "Viva Fresh",
    nameAlbanian: "Viva Fresh",
    slug: "viva-fresh",
    hqCity: "Prishtinë",
    numberOfStores: 22,
    pricingStrategy: "HiLo",
    description: "Supermarket i orientuar drejt produkteve të freskëta, me strategji Hi-Lo (çmime bazë të larta + promocione të shpeshta).",
    websiteUrl: "https://vivafresh.com",
  },
  {
    name: "Proex",
    nameAlbanian: "Proex",
    slug: "proex",
    hqCity: "Prishtinë",
    numberOfStores: 18,
    pricingStrategy: "VALUE",
    description: "Zinxhir me fokus në vlerë dhe produkte lokale kosovare.",
  },
  {
    name: "Bucaj",
    nameAlbanian: "Bucaj",
    slug: "bucaj",
    hqCity: "Prizren",
    numberOfStores: 14,
    pricingStrategy: "DISCOUNT",
    description: "Supermarket me bazë në Prizren, i njohur për çmimet e ulëta dhe ofertat speciale.",
  },
  {
    name: "ICA Grup",
    nameAlbanian: "ICA Grup",
    slug: "ica-grup",
    hqCity: "Prishtinë",
    numberOfStores: 31,
    pricingStrategy: "PREMIUM",
    description: "Zinxhir i orientuar drejt segmentit premium me produkte të importuara.",
  },
  {
    name: "City Market",
    nameAlbanian: "City Market",
    slug: "city-market",
    hqCity: "Prishtinë",
    numberOfStores: 12,
    pricingStrategy: "CONVENIENCE",
    description: "Dyqane konvenienti në qendra urbane, çmime pak mbi mesatare por lokacion superior.",
  },
  {
    name: "Familia",
    nameAlbanian: "Familia",
    slug: "familia",
    hqCity: "Gjakovë",
    numberOfStores: 9,
    pricingStrategy: "VALUE",
    description: "Supermarket rajonal me bazë në Gjakovë.",
  },
];

const PRODUCTS_SEED = [
  // BEVERAGES (7)
  { name: "Coca-Cola 2L", nameAlbanian: "Coca-Cola 2L", brand: "Coca-Cola", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 2, unitLabel: "2L", cogs: 0.82, currentPrice: 1.15, sku: "BEV-001" },
  { name: "Pepsi 1.5L", nameAlbanian: "Pepsi 1.5L", brand: "Pepsi", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.64, currentPrice: 0.89, sku: "BEV-002" },
  { name: "Uji Rugova 1.5L", nameAlbanian: "Uji Rugova 1.5L", brand: "Rugova", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.18, currentPrice: 0.35, sku: "BEV-003" },
  { name: "Red Bull 250ml", nameAlbanian: "Red Bull 250ml", brand: "Red Bull", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 0.25, unitLabel: "250ml", cogs: 0.82, currentPrice: 1.45, sku: "BEV-004" },
  { name: "Capri-Sun 200ml", nameAlbanian: "Capri-Sun 200ml", brand: "Capri-Sun", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200ml", cogs: 0.28, currentPrice: 0.45, sku: "BEV-005" },
  { name: "Fanta Portokall 1.5L", nameAlbanian: "Fanta Portokall 1.5L", brand: "Coca-Cola", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 1.5, unitLabel: "1.5L", cogs: 0.70, currentPrice: 0.99, sku: "BEV-006" },
  { name: "Uji i gazuar Soda 1L", nameAlbanian: "Uji i gazuar Soda 1L", brand: "Rugova", category: "BEVERAGES" as ProductCategory, unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 0.22, currentPrice: 0.39, sku: "BEV-007" },
  // DAIRY (7)
  { name: "Qumështi Deva 1L", nameAlbanian: "Qumështi Deva 1L", brand: "Deva", category: "DAIRY" as ProductCategory, unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 0.72, currentPrice: 0.99, sku: "DAI-001" },
  { name: "Djathë i Bardhë 400g", nameAlbanian: "Djathë i Bardhë 400g", brand: "Gëzimi", category: "DAIRY" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.45, currentPrice: 2.15, sku: "DAI-002" },
  { name: "Kosi 500g", nameAlbanian: "Kosi 500g", brand: "Deva", category: "DAIRY" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.68, currentPrice: 0.95, sku: "DAI-003" },
  { name: "Gjalpë 200g", nameAlbanian: "Gjalpë 200g", brand: "Milkos", category: "DAIRY" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.20, currentPrice: 1.75, sku: "DAI-004" },
  { name: "Vezë Fshati 12 copë", nameAlbanian: "Vezë Fshati 12 copë", brand: "Agrokos", category: "DAIRY" as ProductCategory, unit: "pack", unitSize: 12, unitLabel: "12 copë", cogs: 1.55, currentPrice: 2.20, sku: "DAI-005" },
  { name: "Krem djathë Philadelphia 200g", nameAlbanian: "Krem djathë 200g", brand: "Kraft", category: "DAIRY" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.80, currentPrice: 2.59, sku: "DAI-006" },
  { name: "Qumësht i kondensuar 400g", nameAlbanian: "Qumësht i kondensuar 400g", brand: "Nestlé", category: "DAIRY" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.95, currentPrice: 1.39, sku: "DAI-007" },
  // MEAT_POULTRY (5)
  { name: "Pulë e tërë 1kg", nameAlbanian: "Pulë e tërë 1kg", brand: "Kosovatex", category: "MEAT_POULTRY" as ProductCategory, unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 2.45, currentPrice: 3.49, sku: "MEA-001" },
  { name: "Mish viçi i grirë 500g", nameAlbanian: "Mish viçi i grirë 500g", brand: "Jumbo", category: "MEAT_POULTRY" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 2.80, currentPrice: 3.99, sku: "MEA-002" },
  { name: "Suxhuk 300g", nameAlbanian: "Suxhuk 300g", brand: "Arben", category: "MEAT_POULTRY" as ProductCategory, unit: "piece", unitSize: 0.3, unitLabel: "300g", cogs: 1.65, currentPrice: 2.49, sku: "MEA-003" },
  { name: "Gjoks pule 500g", nameAlbanian: "Gjoks pule 500g", brand: "Kosovatex", category: "MEAT_POULTRY" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 2.10, currentPrice: 2.99, sku: "MEA-004" },
  { name: "Salami Milano 150g", nameAlbanian: "Salami Milano 150g", brand: "Maestro", category: "MEAT_POULTRY" as ProductCategory, unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 1.35, currentPrice: 1.99, sku: "MEA-005" },
  // FRUITS_VEGETABLES (6)
  { name: "Domate 1kg", nameAlbanian: "Domate 1kg", brand: null, category: "FRUITS_VEGETABLES" as ProductCategory, unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.62, currentPrice: 0.99, sku: "FRU-001" },
  { name: "Patate 2kg", nameAlbanian: "Patate 2kg", brand: null, category: "FRUITS_VEGETABLES" as ProductCategory, unit: "piece", unitSize: 2, unitLabel: "2kg", cogs: 0.78, currentPrice: 1.19, sku: "FRU-002" },
  { name: "Banane 1kg", nameAlbanian: "Banane 1kg", brand: null, category: "FRUITS_VEGETABLES" as ProductCategory, unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.75, currentPrice: 1.15, sku: "FRU-003" },
  { name: "Qepë 1kg", nameAlbanian: "Qepë 1kg", brand: null, category: "FRUITS_VEGETABLES" as ProductCategory, unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.42, currentPrice: 0.69, sku: "FRU-004" },
  { name: "Mollë 1kg", nameAlbanian: "Mollë 1kg", brand: null, category: "FRUITS_VEGETABLES" as ProductCategory, unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.82, currentPrice: 1.29, sku: "FRU-005" },
  { name: "Kastravec 1kg", nameAlbanian: "Kastravec 1kg", brand: null, category: "FRUITS_VEGETABLES" as ProductCategory, unit: "kg", unitSize: 1, unitLabel: "1kg", cogs: 0.55, currentPrice: 0.89, sku: "FRU-006" },
  // BAKERY (4)
  { name: "Buka e bardhë 500g", nameAlbanian: "Buka e bardhë 500g", brand: "Bajgora", category: "BAKERY" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.38, currentPrice: 0.55, sku: "BAK-001" },
  { name: "Kroasant 60g", nameAlbanian: "Kroasant 60g", brand: "Pan", category: "BAKERY" as ProductCategory, unit: "piece", unitSize: 0.06, unitLabel: "60g", cogs: 0.18, currentPrice: 0.29, sku: "BAK-002" },
  { name: "Buka integrale 400g", nameAlbanian: "Buka integrale 400g", brand: "Bajgora", category: "BAKERY" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.45, currentPrice: 0.69, sku: "BAK-003" },
  { name: "Simite me kripë 80g", nameAlbanian: "Simite me kripë 80g", brand: "Pan", category: "BAKERY" as ProductCategory, unit: "piece", unitSize: 0.08, unitLabel: "80g", cogs: 0.12, currentPrice: 0.19, sku: "BAK-004" },
  // SNACKS (5)
  { name: "Lay's Çips 150g", nameAlbanian: "Lay's Çips 150g", brand: "Lay's", category: "SNACKS_CONFECTIONERY" as ProductCategory, unit: "piece", unitSize: 0.15, unitLabel: "150g", cogs: 0.72, currentPrice: 1.09, sku: "SNK-001" },
  { name: "Nutella 400g", nameAlbanian: "Nutella 400g", brand: "Ferrero", category: "SNACKS_CONFECTIONERY" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 2.45, currentPrice: 3.49, sku: "SNK-002" },
  { name: "Kinder Bueno 43g", nameAlbanian: "Kinder Bueno 43g", brand: "Ferrero", category: "SNACKS_CONFECTIONERY" as ProductCategory, unit: "piece", unitSize: 0.043, unitLabel: "43g", cogs: 0.62, currentPrice: 0.89, sku: "SNK-003" },
  { name: "Pringles Original 165g", nameAlbanian: "Pringles 165g", brand: "Pringles", category: "SNACKS_CONFECTIONERY" as ProductCategory, unit: "piece", unitSize: 0.165, unitLabel: "165g", cogs: 1.15, currentPrice: 1.69, sku: "SNK-004" },
  { name: "KitKat 4-finger 45g", nameAlbanian: "KitKat 45g", brand: "Nestlé", category: "SNACKS_CONFECTIONERY" as ProductCategory, unit: "piece", unitSize: 0.045, unitLabel: "45g", cogs: 0.42, currentPrice: 0.65, sku: "SNK-005" },
  // PASTA_GRAINS (4)
  { name: "Makarona Barilla 500g", nameAlbanian: "Makarona Barilla 500g", brand: "Barilla", category: "PASTA_GRAINS" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.68, currentPrice: 0.99, sku: "PAS-001" },
  { name: "Oriz Basmati 1kg", nameAlbanian: "Oriz Basmati 1kg", brand: "Tilda", category: "PASTA_GRAINS" as ProductCategory, unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 1.45, currentPrice: 2.09, sku: "PAS-002" },
  { name: "Miell gruri 1kg", nameAlbanian: "Miell gruri 1kg", brand: "Shpat", category: "PASTA_GRAINS" as ProductCategory, unit: "piece", unitSize: 1, unitLabel: "1kg", cogs: 0.48, currentPrice: 0.69, sku: "PAS-003" },
  { name: "Makarona Penne 500g", nameAlbanian: "Makarona Penne 500g", brand: "De Cecco", category: "PASTA_GRAINS" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.85, currentPrice: 1.19, sku: "PAS-004" },
  // OILS_FATS (3)
  { name: "Vaj ulliri 750ml", nameAlbanian: "Vaj ulliri 750ml", brand: "Bertolli", category: "OILS_FATS" as ProductCategory, unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 3.20, currentPrice: 4.49, sku: "OIL-001" },
  { name: "Vaj luledielli 1L", nameAlbanian: "Vaj luledielli 1L", brand: "Bona", category: "OILS_FATS" as ProductCategory, unit: "piece", unitSize: 1, unitLabel: "1L", cogs: 1.42, currentPrice: 1.99, sku: "OIL-002" },
  { name: "Margarine Rama 500g", nameAlbanian: "Margarine Rama 500g", brand: "Unilever", category: "OILS_FATS" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500g", cogs: 0.88, currentPrice: 1.29, sku: "OIL-003" },
  // COFFEE_TEA (4)
  { name: "Kafe Bona 250g", nameAlbanian: "Kafe Bona 250g", brand: "Bona", category: "COFFEE_TEA" as ProductCategory, unit: "piece", unitSize: 0.25, unitLabel: "250g", cogs: 2.15, currentPrice: 3.19, sku: "COF-001" },
  { name: "Kafe Nescafé Classic 200g", nameAlbanian: "Nescafé Classic 200g", brand: "Nestlé", category: "COFFEE_TEA" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 3.45, currentPrice: 4.89, sku: "COF-002" },
  { name: "Çaj Lipton 25 filtra", nameAlbanian: "Çaj Lipton 25 filtra", brand: "Lipton", category: "COFFEE_TEA" as ProductCategory, unit: "piece", unitSize: 25, unitLabel: "25 filtra", cogs: 0.88, currentPrice: 1.29, sku: "COF-003" },
  { name: "Kafe Lavazza 250g", nameAlbanian: "Kafe Lavazza 250g", brand: "Lavazza", category: "COFFEE_TEA" as ProductCategory, unit: "piece", unitSize: 0.25, unitLabel: "250g", cogs: 3.80, currentPrice: 5.49, sku: "COF-004" },
  // CLEANING (4)
  { name: "Ariel 3kg", nameAlbanian: "Ariel 3kg", brand: "P&G", category: "CLEANING" as ProductCategory, unit: "piece", unitSize: 3, unitLabel: "3kg", cogs: 4.20, currentPrice: 5.99, sku: "CLE-001" },
  { name: "Fairy 750ml", nameAlbanian: "Fairy 750ml", brand: "P&G", category: "CLEANING" as ProductCategory, unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 0.98, currentPrice: 1.45, sku: "CLE-002" },
  { name: "Flash Spray 750ml", nameAlbanian: "Flash Spray 750ml", brand: "P&G", category: "CLEANING" as ProductCategory, unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 0.85, currentPrice: 1.29, sku: "CLE-003" },
  { name: "Persil Color 2kg", nameAlbanian: "Persil Color 2kg", brand: "Henkel", category: "CLEANING" as ProductCategory, unit: "piece", unitSize: 2, unitLabel: "2kg", cogs: 3.10, currentPrice: 4.49, sku: "CLE-004" },
  // PERSONAL_CARE (5)
  { name: "Head & Shoulders 400ml", nameAlbanian: "Head & Shoulders 400ml", brand: "P&G", category: "PERSONAL_CARE" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400ml", cogs: 2.20, currentPrice: 3.15, sku: "PER-001" },
  { name: "Colgate Triple Action 75ml", nameAlbanian: "Colgate Triple Action 75ml", brand: "Colgate", category: "PERSONAL_CARE" as ProductCategory, unit: "piece", unitSize: 0.075, unitLabel: "75ml", cogs: 0.72, currentPrice: 1.09, sku: "PER-002" },
  { name: "Dove Soap 90g", nameAlbanian: "Dove Soap 90g", brand: "Unilever", category: "PERSONAL_CARE" as ProductCategory, unit: "piece", unitSize: 0.09, unitLabel: "90g", cogs: 0.55, currentPrice: 0.89, sku: "PER-003" },
  { name: "Nivea Cream 150ml", nameAlbanian: "Nivea Cream 150ml", brand: "Beiersdorf", category: "PERSONAL_CARE" as ProductCategory, unit: "piece", unitSize: 0.15, unitLabel: "150ml", cogs: 1.45, currentPrice: 2.19, sku: "PER-004" },
  { name: "Gillette Mach3 Shave Gel 200ml", nameAlbanian: "Gillette Shave Gel 200ml", brand: "P&G", category: "PERSONAL_CARE" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200ml", cogs: 1.80, currentPrice: 2.69, sku: "PER-005" },
  // HOUSEHOLD (4)
  { name: "Letër higjienike Zewa 4-pak", nameAlbanian: "Letër higjienike Zewa 4-pak", brand: "Zewa", category: "HOUSEHOLD" as ProductCategory, unit: "pack", unitSize: 4, unitLabel: "4 copë", cogs: 0.88, currentPrice: 1.29, sku: "HOU-001" },
  { name: "Peceta fytyre Kleenex 3-pak", nameAlbanian: "Kleenex 3-pak", brand: "Kleenex", category: "HOUSEHOLD" as ProductCategory, unit: "pack", unitSize: 3, unitLabel: "3 kutia", cogs: 1.10, currentPrice: 1.59, sku: "HOU-002" },
  { name: "Qese mbeturinash 50L 20 cope", nameAlbanian: "Qese mbeturinash 20 cope", brand: "Fino", category: "HOUSEHOLD" as ProductCategory, unit: "pack", unitSize: 20, unitLabel: "20 cope", cogs: 0.65, currentPrice: 0.99, sku: "HOU-003" },
  { name: "Letër kuzhine 2-pak", nameAlbanian: "Letër kuzhine 2-pak", brand: "Zewa", category: "HOUSEHOLD" as ProductCategory, unit: "pack", unitSize: 2, unitLabel: "2 rulona", cogs: 0.72, currentPrice: 1.09, sku: "HOU-004" },
  // CONDIMENTS (4)
  { name: "Ketchup Heinz 570g", nameAlbanian: "Ketchup Heinz 570g", brand: "Heinz", category: "CONDIMENTS" as ProductCategory, unit: "piece", unitSize: 0.57, unitLabel: "570g", cogs: 1.55, currentPrice: 2.19, sku: "CON-001" },
  { name: "Majonezë Hellmann's 400g", nameAlbanian: "Majonezë Hellmann's 400g", brand: "Unilever", category: "CONDIMENTS" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 1.42, currentPrice: 2.09, sku: "CON-002" },
  { name: "Mustardë French's 255g", nameAlbanian: "Mustardë French's 255g", brand: "French's", category: "CONDIMENTS" as ProductCategory, unit: "piece", unitSize: 0.255, unitLabel: "255g", cogs: 0.95, currentPrice: 1.49, sku: "CON-003" },
  { name: "Uthull molle 500ml", nameAlbanian: "Uthull molle 500ml", brand: "Hengstenberg", category: "CONDIMENTS" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.68, currentPrice: 0.99, sku: "CON-004" },
  // CANNED_GOODS (4)
  { name: "Ton Rio Mare 160g", nameAlbanian: "Ton Rio Mare 160g", brand: "Rio Mare", category: "CANNED_GOODS" as ProductCategory, unit: "piece", unitSize: 0.16, unitLabel: "160g", cogs: 1.25, currentPrice: 1.85, sku: "CAN-001" },
  { name: "Fasule e kuqe konservë 400g", nameAlbanian: "Fasule e kuqe 400g", brand: "Bonduelle", category: "CANNED_GOODS" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.55, currentPrice: 0.85, sku: "CAN-002" },
  { name: "Salcë domatesh Mutti 400g", nameAlbanian: "Salcë domatesh 400g", brand: "Mutti", category: "CANNED_GOODS" as ProductCategory, unit: "piece", unitSize: 0.4, unitLabel: "400g", cogs: 0.72, currentPrice: 1.09, sku: "CAN-003" },
  { name: "Misër i konservuar 340g", nameAlbanian: "Misër i konservuar 340g", brand: "Bonduelle", category: "CANNED_GOODS" as ProductCategory, unit: "piece", unitSize: 0.34, unitLabel: "340g", cogs: 0.48, currentPrice: 0.75, sku: "CAN-004" },
  // FROZEN (3)
  { name: "Pizza Dr. Oetker Margherita 355g", nameAlbanian: "Pizza Margherita 355g", brand: "Dr. Oetker", category: "FROZEN" as ProductCategory, unit: "piece", unitSize: 0.355, unitLabel: "355g", cogs: 1.65, currentPrice: 2.49, sku: "FRZ-001" },
  { name: "Patate të ngrira McCain 750g", nameAlbanian: "Patate të ngrira 750g", brand: "McCain", category: "FROZEN" as ProductCategory, unit: "piece", unitSize: 0.75, unitLabel: "750g", cogs: 1.20, currentPrice: 1.79, sku: "FRZ-002" },
  { name: "Akullorë Magnum Classic 120ml", nameAlbanian: "Akullorë Magnum 120ml", brand: "Unilever", category: "FROZEN" as ProductCategory, unit: "piece", unitSize: 0.12, unitLabel: "120ml", cogs: 0.72, currentPrice: 1.19, sku: "FRZ-003" },
  // ALCOHOL (3)
  { name: "Birra Heineken 500ml", nameAlbanian: "Birra Heineken 500ml", brand: "Heineken", category: "ALCOHOL" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.68, currentPrice: 1.09, sku: "ALC-001" },
  { name: "Birra Peja 500ml", nameAlbanian: "Birra Peja 500ml", brand: "Peja", category: "ALCOHOL" as ProductCategory, unit: "piece", unitSize: 0.5, unitLabel: "500ml", cogs: 0.42, currentPrice: 0.69, sku: "ALC-002" },
  { name: "Verë e kuqe Merlot 750ml", nameAlbanian: "Verë e kuqe Merlot 750ml", brand: "Stone Castle", category: "ALCOHOL" as ProductCategory, unit: "piece", unitSize: 0.75, unitLabel: "750ml", cogs: 2.80, currentPrice: 4.99, sku: "ALC-003" },
  // BABY (2)
  { name: "Pampers Active Baby 3 (40 copë)", nameAlbanian: "Pampers nr.3 40 copë", brand: "P&G", category: "BABY" as ProductCategory, unit: "pack", unitSize: 40, unitLabel: "40 copë", cogs: 5.20, currentPrice: 7.49, sku: "BAB-001" },
  { name: "Nenë ushqim fëmijësh Nestlé 125g", nameAlbanian: "Ushqim fëmijësh 125g", brand: "Nestlé", category: "BABY" as ProductCategory, unit: "piece", unitSize: 0.125, unitLabel: "125g", cogs: 0.65, currentPrice: 0.99, sku: "BAB-002" },
  // DELI (3)
  { name: "Proshutë e tymosur 100g", nameAlbanian: "Proshutë e tymosur 100g", brand: "Maestro", category: "DELI" as ProductCategory, unit: "piece", unitSize: 0.1, unitLabel: "100g", cogs: 1.20, currentPrice: 1.89, sku: "DEL-001" },
  { name: "Djathë Gouda i prerë 200g", nameAlbanian: "Djathë Gouda 200g", brand: "Milkos", category: "DELI" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 1.55, currentPrice: 2.29, sku: "DEL-002" },
  { name: "Olive të zeza 200g", nameAlbanian: "Olive të zeza 200g", brand: "Meze", category: "DELI" as ProductCategory, unit: "piece", unitSize: 0.2, unitLabel: "200g", cogs: 0.82, currentPrice: 1.29, sku: "DEL-003" },
];

async function main() {
  console.log("🌱 Seeding PriceSync Manager database with Kosovo retail data...\n");

  // Create competitors
  console.log("📊 Creating Kosovo competitors...");
  const createdCompetitors = await Promise.all(
    COMPETITORS.map((c) =>
      prisma.competitor.upsert({
        where: { slug: c.slug },
        update: {},
        create: {
          ...c,
          isActive: true,
        },
      })
    )
  );
  console.log(`  ✓ Created ${createdCompetitors.length} competitors\n`);

  // Create demo company (ELKOS-like)
  console.log("🏢 Creating demo retail chain (MarkAl Group)...");
  const company = await prisma.company.upsert({
    where: { clerkOrgId: "demo_org_markal" },
    update: {},
    create: {
      clerkOrgId: "demo_org_markal",
      name: "MarkAl Group",
      nameAlbanian: "MarkAl Group",
      slug: "markal-group",
      hqCity: "Prishtinë",
      hqAddress: "Rr. Nënë Tereza, Nr. 24, Prishtinë",
      numberOfStores: 8,
      annualRevenue: 45_000_000,
      currency: "EUR",
      country: "XK",
      subscriptionTier: "enterprise",
    },
  });

  // Create demo user
  await prisma.companyUser.upsert({
    where: { clerkUserId_companyId: { clerkUserId: "demo_user_001", companyId: company.id } },
    update: {},
    create: {
      clerkUserId: "demo_user_001",
      companyId: company.id,
      role: UserRole.ADMIN,
      name: "Arben Krasniqi",
      email: "arben@markal.com",
    },
  });

  // Create stores
  console.log("🏪 Creating store network...");
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { id: "store_prishtina_center" },
      update: {},
      create: {
        id: "store_prishtina_center",
        companyId: company.id,
        name: "MarkAl - Qendra Prishtinë",
        city: "Prishtinë",
        region: KosovoRegion.PRISHTINA,
        address: "Rr. Nënë Tereza 24",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 2400,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_prishtina_dardania" },
      update: {},
      create: {
        id: "store_prishtina_dardania",
        companyId: company.id,
        name: "MarkAl - Dardania",
        city: "Prishtinë",
        region: KosovoRegion.PRISHTINA,
        address: "Lagjja Dardania, B.11",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 1800,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_prizren" },
      update: {},
      create: {
        id: "store_prizren",
        companyId: company.id,
        name: "MarkAl - Prizren",
        city: "Prizren",
        region: KosovoRegion.PRIZREN,
        address: "Rr. Remzi Ademaj 8",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 1600,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_peja" },
      update: {},
      create: {
        id: "store_peja",
        companyId: company.id,
        name: "MarkAl - Pejë",
        city: "Pejë",
        region: KosovoRegion.PEJA,
        address: "Rr. Mbretëresha Teuta 5",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 1200,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_ferizaj" },
      update: {},
      create: {
        id: "store_ferizaj",
        companyId: company.id,
        name: "MarkAl - Ferizaj",
        city: "Ferizaj",
        region: KosovoRegion.FERIZAJ,
        address: "Rr. Agim Ramadani 3",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 1100,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_gjakova" },
      update: {},
      create: {
        id: "store_gjakova",
        companyId: company.id,
        name: "MarkAl - Gjakovë",
        city: "Gjakovë",
        region: KosovoRegion.GJAKOVA,
        address: "Sheshi Ismail Qemali 1",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 1350,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_gjilan" },
      update: {},
      create: {
        id: "store_gjilan",
        companyId: company.id,
        name: "MarkAl - Gjilan",
        city: "Gjilan",
        region: KosovoRegion.GJILAN,
        address: "Rr. Garibaldi 12",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 1000,
        isActive: true,
      },
    }),
    prisma.store.upsert({
      where: { id: "store_mitrovica" },
      update: {},
      create: {
        id: "store_mitrovica",
        companyId: company.id,
        name: "MarkAl - Mitrovicë",
        city: "Mitrovicë",
        region: KosovoRegion.MITROVICA,
        address: "Rr. Adem Jashari 7",
        storeType: StoreType.SUPERMARKET,
        salesFloorM2: 950,
        isActive: true,
      },
    }),
  ]);
  console.log(`  ✓ Created ${stores.length} stores\n`);

  // Track all competitors
  await Promise.all(
    createdCompetitors.map((comp) =>
      prisma.companyCompetitor.upsert({
        where: { companyId_competitorId: { companyId: company.id, competitorId: comp.id } },
        update: {},
        create: { companyId: company.id, competitorId: comp.id, isTracked: true },
      })
    )
  );

  // Create products
  console.log(`📦 Creating product catalog (${PRODUCTS_SEED.length} SKUs)...`);
  const createdProducts = await Promise.all(
    PRODUCTS_SEED.map((p) => {
      const margin = ((p.currentPrice - p.cogs) / p.currentPrice) * 100;
      return prisma.product.upsert({
        where: { companyId_sku: { companyId: company.id, sku: p.sku } },
        update: {},
        create: {
          companyId: company.id,
          sku: p.sku,
          name: p.name,
          nameAlbanian: p.nameAlbanian,
          brand: p.brand,
          category: p.category,
          unit: p.unit,
          unitSize: p.unitSize,
          unitLabel: p.unitLabel,
          cogs: p.cogs,
          currentPrice: p.currentPrice,
          currentMargin: parseFloat(margin.toFixed(2)),
          minMargin: 2.0,
          maxMargin: p.category === "TOBACCO" ? 20 : p.category === "ALCOHOL" ? 25 : 35,
          isActive: true,
        },
      });
    })
  );
  console.log(`  ✓ Created ${createdProducts.length} products\n`);

  // Create competitor products + prices
  console.log("💰 Seeding competitor price data...");
  let priceCount = 0;

  for (const competitor of createdCompetitors) {
    const compProducts = await Promise.all(
      PRODUCTS_SEED.map(async (p) => {
        const baseVariance = getCompetitorVariance(competitor.pricingStrategy ?? "VALUE");
        const compPrice = parseFloat((p.currentPrice * (1 + (Math.random() - 0.5) * baseVariance)).toFixed(2));

        const cp = await prisma.competitorProduct.upsert({
          where: { competitorId_name: { competitorId: competitor.id, name: p.name } },
          update: {},
          create: {
            competitorId: competitor.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            sku: `${competitor.slug.toUpperCase()}-${p.sku}`,
            unit: p.unit,
            unitSize: p.unitSize,
            unitLabel: p.unitLabel,
            isAvailable: Math.random() > 0.08, // 92% in stock
            lastSeenAt: new Date(),
          },
        });

        // Create price history (last 30 days)
        const prices = [];
        for (let day = 29; day >= 0; day--) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          const priceVariation = compPrice * (1 + (Math.random() - 0.5) * 0.04);
          prices.push({
            competitorProductId: cp.id,
            price: parseFloat(priceVariation.toFixed(2)),
            isInStock: Math.random() > 0.05,
            source: PriceSource.MANUAL,
            recordedAt: date,
          });
        }

        await prisma.competitorPrice.createMany({ data: prices, skipDuplicates: true });
        priceCount += prices.length;

        // Create product mapping
        const ourProduct = createdProducts.find((prod) => prod.sku === p.sku);
        if (ourProduct) {
          await prisma.competitorProductMap.upsert({
            where: { productId_competitorProductId: { productId: ourProduct.id, competitorProductId: cp.id } },
            update: {},
            create: {
              productId: ourProduct.id,
              competitorProductId: cp.id,
              matchConfidence: 0.95 + Math.random() * 0.05,
              isVerified: Math.random() > 0.3,
            },
          });
        }

        return cp;
      })
    );
  }
  console.log(`  ✓ Created ${priceCount} competitor price records\n`);

  // Create price history for our products
  console.log("📈 Creating our product price history...");
  for (const product of createdProducts) {
    const history = [];
    for (let day = 29; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const variance = (Math.random() - 0.5) * 0.03;
      const histPrice = parseFloat((product.currentPrice * (1 + variance)).toFixed(2));
      const margin = ((histPrice - product.cogs) / histPrice) * 100;
      history.push({
        productId: product.id,
        storeId: stores[0].id,
        price: histPrice,
        cogs: product.cogs,
        margin: parseFloat(margin.toFixed(2)),
        recordedAt: date,
      });
    }
    await prisma.productPrice.createMany({ data: history, skipDuplicates: true });
  }

  // Create recommendations
  console.log("🤖 Generating AI margin recommendations...");
  const recData = [];
  for (const product of createdProducts.slice(0, 20)) {
    const mappings = await prisma.competitorProductMap.findMany({
      where: { productId: product.id },
      include: {
        competitorProduct: {
          include: { prices: { orderBy: { recordedAt: "desc" }, take: 1 } },
        },
      },
    });
    const competitorPrices = mappings
      .map((m) => m.competitorProduct.prices[0]?.price)
      .filter(Boolean) as number[];

    if (competitorPrices.length === 0) continue;

    const result = optimizeMargin({
      productName: product.name,
      category: product.category,
      cogs: product.cogs,
      currentPrice: product.currentPrice,
      currentMargin: product.currentMargin,
      minMargin: product.minMargin,
      maxMargin: product.maxMargin,
      competitorPrices,
      regionDemandMultiplier: 0.9 + Math.random() * 0.3,
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    recData.push({
      companyId: company.id,
      productId: product.id,
      currentPrice: product.currentPrice,
      currentMargin: product.currentMargin,
      recommendedPrice: parseFloat(result.recommendedPrice.toFixed(2)),
      recommendedMargin: parseFloat(result.recommendedMargin.toFixed(2)),
      confidenceScore: result.confidenceScore,
      expectedRevenueDelta: parseFloat(result.expectedRevenueDelta.toFixed(2)),
      rationale: result.rationale,
      rationaleAlbanian: result.rationaleAlbanian,
      competitorMinPrice: result.competitorMinPrice,
      competitorMaxPrice: result.competitorMaxPrice,
      competitorAvgPrice: result.competitorAvgPrice,
      expiresAt,
    });
  }
  await prisma.priceRecommendation.createMany({ data: recData });
  console.log(`  ✓ Created ${recData.length} margin recommendations\n`);

  // Create alerts
  console.log("🔔 Creating margin alerts...");
  const alerts = [
    {
      companyId: company.id,
      alertType: AlertType.PRICE_SPIKE,
      severity: AlertSeverity.HIGH,
      title: "Plus Market rriti çmimin e kafesë me 12%",
      titleAlbanian: "Plus Market rriti çmimin e kafesë me 12%",
      description: "Plus Market rriti çmimin e Nescafé Classic 200g nga €4.29 në €4.89 sot. Mundësi për rritje marzhi.",
      descriptionAlbanian: "Plus Market rriti çmimin e Nescafé Classic 200g nga €4.29 në €4.89 sot. Mundësi për rritje marzhi.",
      metadata: { competitor: "Plus Market", product: "Nescafé Classic 200g", oldPrice: 4.29, newPrice: 4.89, changePct: 13.99 },
    },
    {
      companyId: company.id,
      alertType: AlertType.MARGIN_OPPORTUNITY,
      severity: AlertSeverity.HIGH,
      title: "Mundësi rritje marzhi: 23 artikuj",
      titleAlbanian: "Mundësi rritje marzhi: 23 artikuj",
      description: "Ju mund të rrisni marzhit me siguri me 2% në 23 artikuj këtë orë. Fitim i mundshëm shtesë: €340/ditë.",
      descriptionAlbanian: "Ju mund të rrisni marzhit me siguri me 2% në 23 artikuj këtë orë. Fitim i mundshëm shtesë: €340/ditë.",
      metadata: { count: 23, potentialDailyRevenue: 340 },
    },
    {
      companyId: company.id,
      alertType: AlertType.COMPETITOR_OUT_OF_STOCK,
      severity: AlertSeverity.MEDIUM,
      title: "Viva Fresh pa stok — Djathë i Bardhë",
      titleAlbanian: "Viva Fresh pa stok — Djathë i Bardhë",
      description: "Viva Fresh është pa stok për Djathë i Bardhë 400g. Mundësi për rritje çmimi 5-8%.",
      descriptionAlbanian: "Viva Fresh është pa stok për Djathë i Bardhë 400g. Mundësi për rritje çmimi 5-8%.",
      metadata: { competitor: "Viva Fresh", product: "Djathë i Bardhë 400g" },
    },
    {
      companyId: company.id,
      alertType: AlertType.REGIONAL_INCONSISTENCY,
      severity: AlertSeverity.MEDIUM,
      title: "Çmim i ndryshëm rajonal: Coca-Cola 2L",
      titleAlbanian: "Çmim i ndryshëm rajonal: Coca-Cola 2L",
      description: "Coca-Cola 2L kushton €1.15 në Prishtinë por €1.05 në Prizren. Diferenca marzhi: 3.2 pikë bazë.",
      descriptionAlbanian: "Coca-Cola 2L kushton €1.15 në Prishtinë por €1.05 në Prizren. Diferenca marzhi: 3.2 pikë bazë.",
      metadata: { product: "Coca-Cola 2L", prishtina: 1.15, prizren: 1.05 },
    },
    {
      companyId: company.id,
      alertType: AlertType.WEEKLY_SUMMARY,
      severity: AlertSeverity.LOW,
      title: "Raporti javor i marzhit — Java e kaluar",
      titleAlbanian: "Raporti javor i marzhit — Java e kaluar",
      description: "Keni zbatuar 34 nga 67 rekomandimet. Fitim shtesë i realizuar: +€12,400. Mundësi e humbur: €8,200.",
      descriptionAlbanian: "Keni zbatuar 34 nga 67 rekomandimet. Fitim shtesë i realizuar: +€12,400. Mundësi e humbur: €8,200.",
      metadata: { applied: 34, total: 67, gained: 12400, missed: 8200 },
    },
    {
      companyId: company.id,
      alertType: AlertType.COMPETITOR_STRATEGY_CHANGE,
      severity: AlertSeverity.LOW,
      title: "Proex ndërroi strategjinë e çmimit",
      titleAlbanian: "Proex ndërroi strategjinë e çmimit",
      description: "Proex ka ndryshuar 47 çmime në 24 orë të fundit. Analiza sugjeron lëvizje drejt strategjisë EDLP.",
      descriptionAlbanian: "Proex ka ndryshuar 47 çmime në 24 orë të fundit. Analiza sugjeron lëvizje drejt strategjisë EDLP.",
      metadata: { competitor: "Proex", changedItems: 47, period: "24h" },
    },
  ];

  await prisma.marginAlert.createMany({ data: alerts });
  console.log(`  ✓ Created ${alerts.length} alerts\n`);

  // Audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        userId: "demo_user_001",
        userName: "Arben Krasniqi",
        action: "PRICE_UPDATED",
        entityType: "Product",
        newValue: { product: "Coca-Cola 2L", oldPrice: 1.09, newPrice: 1.15, reason: "Competitor raised price" },
      },
      {
        companyId: company.id,
        userId: "demo_user_001",
        userName: "Arben Krasniqi",
        action: "RECOMMENDATION_APPLIED",
        entityType: "PriceRecommendation",
        newValue: { product: "Kafe Bona 250g", marginIncrease: 1.2, revenueImpact: 45 },
      },
    ],
  });

  console.log("\n✅ Seed complete! Kosovo retail demo data is ready.");
  console.log(`
  📊 Summary:
    - ${createdCompetitors.length} Kosovo competitors tracked
    - 8 stores across Kosovo regions
    - ${createdProducts.length} SKUs in product catalog
    - ${priceCount} competitor price data points (30-day history)
    - ${recData.length} AI margin recommendations generated
    - ${alerts.length} active alerts
  `);
}

function getCompetitorVariance(strategy: string): number {
  switch (strategy) {
    case "EDLP": return 0.05;
    case "DISCOUNT": return 0.08;
    case "HiLo": return 0.12;
    case "PREMIUM": return -0.1; // higher prices
    case "CONVENIENCE": return -0.08;
    default: return 0.06;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
