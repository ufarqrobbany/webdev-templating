import * as hbs from 'hbs';

// Variabel ini akan menyimpan konten 'region' secara sementara
const blocks = {};

/**
 * (c) Helper 'block': Mendefinisikan area di layout.
 * Penggunaan di Layout: {{{block "sidebar"}}}
 */
function hbsBlockHelper(name, options) {
  const content = blocks[name];
  delete blocks[name]; // Bersihkan setelah dipakai
  
  if (content) {
    return content; // Kembalikan konten override
  } else {
    return options.fn(this); // Kembalikan konten default
  }
}

/**
 * (c) Helper 'contentFor': Mengisi/override sebuah 'block'.
 * Penggunaan di Halaman: {{#contentFor "sidebar"}}...{{/contentFor}}
 */
function hbsContentForHelper(name, options) {
  // Simpan konten dari halaman ke variabel 'blocks'
  blocks[name] = options.fn(this);
}

try {
  hbs.registerHelper('block', hbsBlockHelper);
  hbs.registerHelper('contentFor', hbsContentForHelper);
  console.log('HBS helpers registered successfully.'); // Tambahkan log untuk debug
} catch (error) {
   console.error('Failed to register HBS helpers:', error); // Log jika gagal
}

// Fungsi ini akan kita panggil di main.ts untuk mendaftarkan helper
export function registerHbsHelpers(): void {
//   hbs.handlebars.registerHelper('block', hbsBlockHelper);     // <-- Tambahkan .handlebars
//   hbs.handlebars.registerHelper('contentFor', hbsContentForHelper); // <-- Tambahkan .handlebars
}