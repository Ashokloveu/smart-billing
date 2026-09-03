export const ONES_NE = ['', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ', 'दस', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस', 'बीस'];
export const ONES_EN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
export const TENS_EN = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/**
 * Format number into South Asian Lakh / Crore system (e.g. 12,45,800.00)
 */
export const formatNepaliCurrency = (amount: any): string => {
  const num = Number(amount) || 0;
  const parts = num.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // South Asian formatting: Last 3 digits grouped, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${formattedInteger}.${decimalPart}`;
};

/**
 * Convert number into English words (South Asian Lakh/Crore numbering)
 */
export const numberToEnglishWords = (amount: any): string => {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const convertLessThanOneThousand = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ONES_EN[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += TENS_EN[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ONES_EN[n] + ' ';
    }
    return result.trim();
  };

  let str = '';
  let n = num;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) str += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) str += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) str += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (n > 0) str += convertLessThanOneThousand(n);

  return str.trim() + ' Rupees Only';
};

/**
 * Convert Nepali BS Date string (e.g. 2081-11-20) into full Nepali text
 */
export const formatBsDateNepali = (bsDate: string): string => {
  if (!bsDate) return '२०८१ फागुन २०';
  const months: Record<string, string> = {
    '01': 'बैशाख', '02': 'जेठ', '03': 'असार', '04': 'साउन',
    '05': 'भदौ', '06': 'असोज', '07': 'कात्तिक', '08': 'मंसिर',
    '09': 'पुष', '10': 'माघ', '11': 'फागुन', '12': 'चैत',
    '1': 'बैशाख', '2': 'जेठ', '3': 'असार', '4': 'साउन',
    '5': 'भदौ', '6': 'असोज', '7': 'कात्तिक', '8': 'मंसिर',
    '9': 'पुष',
  };

  const parts = bsDate.replace('/', '-').split('-');
  if (parts.length >= 3) {
    const year = parts[0];
    const month = months[parts[1]] || 'फागुन';
    const day = parts[2];
    return `${year} ${month} ${day} गते`;
  }
  return bsDate;
};
