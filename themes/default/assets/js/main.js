document.addEventListener('DOMContentLoaded', () => {
  // Reply button functionality
  const replyButtons = document.querySelectorAll('.js-reply-button');
  let currentlyOpenForm = null;

  replyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const commentId = button.dataset.commentId;
      const replyForm = document.getElementById(`reply-form-${commentId}`);
      
      // If clicking the same button that's already open, just close it
      if (currentlyOpenForm === replyForm) {
        replyForm.style.display = 'none';
        currentlyOpenForm = null;
        return;
      }

      // Close any currently open form
      if (currentlyOpenForm) {
        currentlyOpenForm.style.display = 'none';
      }

      // Show the clicked reply form
      replyForm.style.display = 'flex';
      currentlyOpenForm = replyForm;
    });
  });

  // Theme toggle functionality
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
