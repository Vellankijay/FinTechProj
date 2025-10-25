import type { Region, AssetClass } from '@/types';

export const REGIONS: Region[] = [
  'Global',
  'Australasia',
  'Europe',
  'Far East',
  'Middle East',
  'North America',
];

export const ASSET_CLASSES: AssetClass[] = [
  'Public Equity',
  'Private Equity',
  'Venture Capital',
  'Debt Financing',
  'IPO Pipeline',
];

export const COUNTRIES_BY_REGION: Record<Exclude<Region, 'Global'>, string[]> = {
  Australasia: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
  Europe: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland'],
  'Far East': ['Japan', 'China', 'South Korea', 'Hong Kong', 'Taiwan', 'Singapore'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Israel', 'Kuwait', 'Bahrain'],
  'North America': ['United States', 'Canada', 'Mexico'],
};

export const OFFICES = [
  'New York',
  'London',
  'Tokyo',
  'Hong Kong',
  'Singapore',
  'Sydney',
  'Frankfurt',
  'Paris',
  'Dubai',
  'Toronto',
  'Chicago',
  'San Francisco',
  'Mumbai',
  'Shanghai',
  'Seoul',
];

export const DESKS = [
  'Cloud Computing',
  'AI & Machine Learning',
  'Cybersecurity',
  'Enterprise Software',
  'Medical Devices',
  'Biotech Investments',
  'Digital Health',
  'Telemedicine',
  'Healthcare IT',
  'Pharma Tech',
];

export const INDUSTRIES = [
  'Software & Cloud',
  'Hardware & Devices',
  'AI & Data Science',
  'Cybersecurity',
  'Medical Technology',
  'Biotechnology',
  'Digital Health',
  'Healthcare IT',
  'Pharma Tech',
  'Telemedicine',
];

export const SECTORS = [
  'SaaS Platforms',
  'Cloud Infrastructure',
  'Enterprise Software',
  'AI/ML Platforms',
  'Semiconductors',
  'IoT Devices',
  'Wearable Tech',
  'Pharmaceuticals',
  'Biotechnology',
  'Medical Devices',
  'Diagnostics',
  'Telemedicine Platforms',
  'EHR Systems',
  'Health Analytics',
  'Drug Discovery',
  'Genomics',
  'Clinical Trials Tech',
];

// Tech companies and healthtech companies
export const SYMBOLS = [
  // Pure Tech Companies (for Tech page)
  'MSFT',   // Microsoft - Cloud & Enterprise Software
  'GOOGL',  // Google - AI & Cloud
  'AMZN',   // Amazon - Cloud Infrastructure (AWS)
  'NVDA',   // NVIDIA - AI/ML Hardware
  'META',   // Meta - AI & Social Platforms
  'TSLA',   // Tesla - Tech & Automotive
  'ORCL',   // Oracle - Enterprise Software
  'CRM',    // Salesforce - SaaS Platform
  'ADBE',   // Adobe - Creative Software
  'CSCO',   // Cisco - Networking & Cybersecurity
  'INTC',   // Intel - Semiconductors
  'AMD',    // AMD - Semiconductors
  'NFLX',   // Netflix - Streaming Tech
  'SNOW',   // Snowflake - Cloud Data Platform
  'PANW',   // Palo Alto Networks - Cybersecurity
  'CRWD',   // CrowdStrike - Cybersecurity
  'NOW',    // ServiceNow - Enterprise Cloud
  'PLTR',   // Palantir - Data Analytics
  'JNJ',    // Johnson & Johnson (has tech division)
  'UNH',    // UnitedHealth (has tech division)
  'PFE',    // Pfizer (has tech division)
  'ABBV',   // AbbVie (has tech division)
  'TMO',    // Thermo Fisher (has tech division)
  'ABT',    // Abbott (has tech division)
  'DHR',    // Danaher (has tech division)
  'LLY',    // Eli Lilly (has tech division)

  // HealthTech Companies (for Healthtech page)
  'VEEV',   // Veeva Systems - Healthcare Cloud
  'TDOC',   // Teladoc - Telemedicine
  'AMWL',   // Amwell - Telemedicine
  'HIMS',   // Hims & Hers - Digital Health
  'DXCM',   // DexCom - Medical Devices (CGM)
  'ISRG',   // Intuitive Surgical - Surgical Robotics
  'ASXC',   // Asensus Surgical - Surgical Robotics
  'HSTM',   // HealthStream - Healthcare IT
  'AAPL',   // Apple - Health Tech (Apple Watch, Health app)
  'GOOG',   // Google - Health Tech (Fitbit, AI diagnostics)

  // Mock/Private HealthTech Companies
  'EPIC',   // Epic Systems - EHR
  'CRNR',   // Cerner - Healthcare IT
  'NRAI',   // NeuroTech AI - AI Diagnostics
  'PACS',   // PACS Systems - Medical Imaging
  'RADAI',  // Radiology AI - AI Imaging
  'PHIT',   // PHI Tech - Health Data Security
  'CLSYNC', // CliniSync - Health Data Exchange
  'MEDBOT', // MedBot Systems - Healthcare Automation
];

// Symbol to industry mapping to ensure proper categorization
export const SYMBOL_INDUSTRY_MAP: Record<string, string> = {
  // Tech Companies
  'MSFT': 'Software & Cloud',
  'GOOGL': 'AI & Data Science',
  'AMZN': 'Software & Cloud',
  'NVDA': 'Hardware & Devices',
  'META': 'AI & Data Science',
  'TSLA': 'Hardware & Devices',
  'ORCL': 'Software & Cloud',
  'CRM': 'Software & Cloud',
  'ADBE': 'Software & Cloud',
  'CSCO': 'Cybersecurity',
  'INTC': 'Hardware & Devices',
  'AMD': 'Hardware & Devices',
  'NFLX': 'Software & Cloud',
  'SNOW': 'Software & Cloud',
  'PANW': 'Cybersecurity',
  'CRWD': 'Cybersecurity',
  'NOW': 'Software & Cloud',
  'PLTR': 'AI & Data Science',
  'JNJ': 'Software & Cloud',
  'UNH': 'Software & Cloud',
  'PFE': 'Software & Cloud',
  'ABBV': 'Software & Cloud',
  'TMO': 'Software & Cloud',
  'ABT': 'Software & Cloud',
  'DHR': 'Software & Cloud',
  'LLY': 'Software & Cloud',

  // HealthTech Companies
  'VEEV': 'Healthcare IT',
  'TDOC': 'Telemedicine',
  'AMWL': 'Telemedicine',
  'HIMS': 'Digital Health',
  'DXCM': 'Medical Technology',
  'ISRG': 'Medical Technology',
  'ASXC': 'Medical Technology',
  'HSTM': 'Healthcare IT',
  'AAPL': 'Digital Health',
  'GOOG': 'Digital Health',
  'EPIC': 'Healthcare IT',
  'CRNR': 'Healthcare IT',
  'NRAI': 'Biotechnology',
  'PACS': 'Healthcare IT',
  'RADAI': 'Biotechnology',
  'PHIT': 'Healthcare IT',
  'CLSYNC': 'Digital Health',
  'MEDBOT': 'Medical Technology',
};

export function getAllCountries(): string[] {
  return Object.values(COUNTRIES_BY_REGION).flat();
}

export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

export function getIndustryForSymbol(symbol: string): string {
  return SYMBOL_INDUSTRY_MAP[symbol] || getRandomElement(INDUSTRIES);
}
