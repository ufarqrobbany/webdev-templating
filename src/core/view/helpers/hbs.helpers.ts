import hbs = require('hbs'); // Import HBS

// Variabel ini akan menyimpan konten 'region' secara sementara
const blocks = {};

/**
 * (c) Helper 'block': Mendefinisikan area di layout.
 * Penggunaan di Layout: {{{block "sidebar"}}}
 */
// 👇 HAPUS ': hbs.HelperOptions' 👇
function hbsBlockHelper(name: string, options): string {
  const blockContent = blocks[name];
  const defaultContent = blockContent
    ? blockContent.join('\n')
    : options.fn(this);
  blocks[name] = [];
  return defaultContent;
}

/**
 * (c) Helper 'contentFor': Mengisi/override sebuah 'block'.
 * Penggunaan di Halaman: {{#contentFor "sidebar"}}...{{/contentFor}}
 */
// 👇 HAPUS ': hbs.HelperOptions' 👇
function hbsContentForHelper(name: string, options): void {
  if (!blocks[name]) {
    blocks[name] = [];
  }
  blocks[name].push(options.fn(this));
}

/**
 * Helper Handlebars untuk perbandingan kesetaraan (equals).
 * Usage: {{#if (eq value1 value2)}} ... {{/if}}
 */
function hbsEqHelper(a: any, b: any): boolean {
  // Pastikan perbandingan aman, konversi ke string jika perlu
  return String(a) === String(b);
}

/**
 * Helper Handlebars untuk mengecek apakah string mengandung substring.
 * Usage: {{#if (contains text subtext)}} ... {{/if}}
 */
function hbsContainsHelper(haystack: any, needle: any): boolean {
  if (typeof haystack !== 'string' || typeof needle !== 'string') {
    return false;
  }
  return haystack.includes(needle);
}

/**
 * Helper Handlebars untuk mengambil bagian dari string.
 * Usage: {{slice string start end}}
 */
function hbsSliceHelper(str: string, start: number, end: number): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str.slice(start, end);
}

/**
 * Helper Handlebars untuk format tanggal dalam Bahasa Indonesia
 * Usage: {{formatDate date}}
 */
function hbsFormatDateHelper(date: Date | string): string {
  const dateObj = new Date(date);
  const now = new Date();

  // Cek apakah tanggal adalah hari ini
  const isToday = dateObj.toDateString() === now.toDateString();

  // Array nama hari dalam Bahasa Indonesia
  const hariIndonesia = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  // Array nama bulan dalam Bahasa Indonesia
  const bulanIndonesia = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const hari = hariIndonesia[dateObj.getDay()];
  const tanggal = dateObj.getDate();
  const bulan = bulanIndonesia[dateObj.getMonth()];
  const tahun = dateObj.getFullYear();
  const jam = String(dateObj.getHours()).padStart(2, '0');
  const menit = String(dateObj.getMinutes()).padStart(2, '0');

  if (isToday) {
    return 'Hari ini, ' + jam + '.' + menit;
  }

  return `${hari}, ${tanggal} ${bulan} ${tahun} - ${jam}.${menit}`;
}

/**
 * Fungsi ini akan dipanggil di main.ts untuk mendaftarkan SEMUA helper.
 */
export function registerHbsHelpers(): void {
  try {
    hbs.registerHelper('block', hbsBlockHelper);
    hbs.registerHelper('contentFor', hbsContentForHelper);
    hbs.registerHelper('eq', hbsEqHelper);
    hbs.registerHelper('contains', hbsContainsHelper);
    hbs.registerHelper('slice', hbsSliceHelper);
    hbs.registerHelper('formatDate', hbsFormatDateHelper);

    console.log(
      'HBS helpers (block, contentFor, eq, contains, slice, formatDate) registered successfully.',
    );
  } catch (error) {
    console.error('Failed to register HBS helpers:', error);
  }
}
