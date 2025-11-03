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
 * Fungsi ini akan dipanggil di main.ts untuk mendaftarkan SEMUA helper.
 */
export function registerHbsHelpers(): void {
  try {
    hbs.registerHelper('block', hbsBlockHelper);
    hbs.registerHelper('contentFor', hbsContentForHelper);
    hbs.registerHelper('eq', hbsEqHelper);

    console.log('HBS helpers (block, contentFor, eq) registered successfully.');
  } catch (error) {
    console.error('Failed to register HBS helpers:', error);
  }
}
