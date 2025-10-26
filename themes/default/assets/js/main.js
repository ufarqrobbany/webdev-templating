document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const currentTheme = localStorage.getItem('theme');

  // 1. Terapkan tema dari localStorage saat halaman dimuat
  if (currentTheme === 'dark') {
    body.classList.add('dark');
  }

  // 2. Tambahkan event listener ke tombol
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark');

      // 3. Simpan pilihan tema ke localStorage
      if (body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    });
  }
});
