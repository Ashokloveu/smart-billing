import { create } from 'zustand';

export type Language = 'en' | 'np';

interface TranslationDictionary {
  [key: string]: {
    en: string;
    np: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  dashboard: { en: 'Dashboard', np: 'ड्यासवेार्ड' },
  salesInvoicing: { en: 'Sales & Invoicing', np: 'बिक्री तथा बिलिङ' },
  posTerminal: { en: 'POS Terminal', np: 'द्रुत काउन्टर (POS)' },
  purchases: { en: 'Purchases & Bills', np: 'खरिद तथा बिलहरू' },
  parties: { en: 'Parties & Customers', np: 'ग्राहक तथा पार्टीहरू' },
  items: { en: 'Items & Services', np: 'सामान तथा सेवाहरू' },
  warehouses: { en: 'Stock & Warehouses', np: 'गोदाम तथा मौज्दात' },
  onlineStore: { en: 'My Digital Store', np: 'मेरो अनलाइन पसल' },
  accounting: { en: 'Accounting & Ledgers', np: 'लेखा तथा खाता' },
  reports: { en: 'Reports & Daybook', np: 'प्रतिवेदन तथा डे-बुक' },
  compliance: { en: 'Nepal VAT & Tax', np: 'नेपाल भ्याट अनुसूची' },
  settings: { en: 'Settings', np: 'सेटिङ्स' },
  signOut: { en: 'Sign Out', np: 'बाहिरिनुहोस्' },

  // Dashboard Metrics
  todaySales: { en: "Today's Invoiced Sales", np: 'आजको कुल बिक्री' },
  totalReceivables: { en: 'Total Receivables', np: 'उठ्न बाँकी रकम (उधारो)' },
  totalPayables: { en: 'Total Payables', np: 'तिर्न बाँकी रकम' },
  netCashBank: { en: 'Net Cash & Bank', np: 'नगद तथा बैंक मौज्दात' },
  quickActions: { en: 'Quick Action Command Bar', np: 'द्रुत कार्य कमाण्ड बार' },
  expressPosBill: { en: '⚡ Express POS Bill', np: '⚡ द्रुत काउन्टर बिल' },
  taxInvoice: { en: '🧾 + Tax Invoice', np: '🧾 + नयाँ कर बिजक' },
  purchaseBill: { en: '📦 + Purchase Bill', np: '📦 + नयाँ खरिद बिल' },
  salesVsPurchase: { en: 'Sales vs. Purchases Performance', np: 'बिक्री तथा खरिद तुलनात्मक विवरण' },
  lowStockRadar: { en: 'Critical Low-Stock Radar', np: 'न्यून मौज्दात चेतावनी' },
  recentTransactions: { en: 'Recent Transactions Stream', np: 'हालैका कारोबारहरू' },

  // Common Actions
  searchPlaceholder: { en: 'Search invoice, customer, item, or command...', np: 'बिजक, ग्राहक, सामान वा कमाण्ड खोज्नुहोस्...' },
  switchBusiness: { en: 'Switch Business / Branch', np: 'पसल / शाखा परिवर्तन' },
  newBusiness: { en: '+ Add New Business / Shop', np: '+ नयाँ पसल / व्यवसाय थप्नुहोस्' },
  fiscalYear: { en: 'Fiscal Year', np: 'आर्थिक वर्ष' },
};

interface LangState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: keyof typeof translations) => string;
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: (localStorage.getItem('smart_billing_lang') as Language) || 'en',
  setLang: (lang: Language) => {
    localStorage.setItem('smart_billing_lang', lang);
    set({ lang });
  },
  toggleLang: () => {
    const nextLang = get().lang === 'en' ? 'np' : 'en';
    localStorage.setItem('smart_billing_lang', nextLang);
    set({ lang: nextLang });
  },
  t: (key: keyof typeof translations) => {
    const currentLang = get().lang;
    const entry = translations[key];
    if (!entry) return String(key);
    return entry[currentLang] || entry.en || String(key);
  },
}));
