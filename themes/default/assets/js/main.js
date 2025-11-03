document.addEventListener('DOMContentLoaded', () => {
    // Profile dropdown functionality
  const profileButton = document.getElementById('profileButton');
  const profileDropdown = document.getElementById('profileDropdown');
  
  if (profileButton && profileDropdown) {
    // Toggle dropdown on profile button click
    profileButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = profileDropdown.style.display === 'block';
      
      // Hide dropdown
      if (isVisible) {
        profileDropdown.style.display = 'none';
        return;
      }
      
      // Show dropdown with animation
      profileDropdown.style.opacity = '0';
      profileDropdown.style.display = 'block';
      setTimeout(() => {
        profileDropdown.style.transition = 'opacity 0.2s ease-out';
        profileDropdown.style.opacity = '1';
      }, 0);
    });

    // Add hover effect to menu items
    const menuItems = profileDropdown.querySelectorAll('a');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = 'rgba(0,0,0,0.05)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '';
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.style.display = 'none';
      }
    });
  }

  // Show selected image name
  const mediaInput = document.getElementById('media');
  if (mediaInput) {
    mediaInput.addEventListener('change', function() {
      const fileName = this.files[0]?.name;
      if (fileName) {
        this.previousElementSibling.innerHTML = `<i class="fas fa-image"></i> ${fileName}`;
      }
    });
  }

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
