// themes/default/assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // Profile dropdown functionality
  const profileButton = document.getElementById('profileButton');
  const profileDropdown = document.getElementById('profileDropdown');

  // Logika edit profil inline (dari kode Anda)
  const editButton = document.getElementById('btn-edit-profile');
  const saveButton = document.getElementById('btn-save-profile');
  const form = document.getElementById('profile-form');

  if (editButton && saveButton && form) {
    const textFields = form.querySelectorAll('.profile-text');
    const inputFields = form.querySelectorAll('.profile-input');

    editButton.addEventListener('click', () => {
      // Masuk mode edit
      textFields.forEach(el => el.hidden = true);
      inputFields.forEach(el => el.hidden = false);

      editButton.hidden = true;
      saveButton.hidden = false;
    });
  }
  
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

  // ===================================================================
  // 👇 BARU: Fungsionalitas Upload Foto Profil 👇
  // ===================================================================
  const uploadButton = document.getElementById('btn-upload-pic');
  const fileInput = document.getElementById('file-upload-input');
  const profilePic = document.querySelector('.profile-pic'); // Gambar yang ditampilkan

  if (uploadButton && fileInput && profilePic) {
    
    // 1. Saat tombol overlay diklik, picu input file yang tersembunyi
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    // 2. Saat file dipilih, segera unggah
    fileInput.addEventListener('change', async () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const formData = new FormData();
        // 'file' adalah nama field yang diharapkan oleh FileInterceptor di NestJS
        formData.append('file', file); 

        try {
          // Tampilkan status loading menggunakan class CSS
          profilePic.classList.add('loading');

          // 3. Kirim ke endpoint upload file Anda
          // (Endpoint ini dari src/files/infrastructure/uploader/local/files.controller.ts)
          const uploadResponse = await fetch('/files/upload', { 
            method: 'POST',
            body: formData,
            // Catatan: Jika endpoint upload Anda dilindungi Auth, Anda perlu
            // menyertakan header Authorization: 'Bearer [token]' di sini.
          });
          
          if (!uploadResponse.ok) {
            console.error('Upload file gagal', await uploadResponse.text());
            throw new Error('Upload file gagal');
          }
          
          const fileData = await uploadResponse.json(); // Hasilnya { id: ..., path: ... }

          // 4. Kirim ID file ke endpoint update profil
          // (Endpoint ini dari src/auth/auth.controller.ts -> update)
          const updateResponse = await fetch('/auth/profile', {
            method: 'POST', // Sesuai controller Anda yang menggunakan @Post()
            headers: {
              'Content-Type': 'application/json',
              // Di sini juga mungkin perlu header Auth jika endpoint dilindungi
            },
            body: JSON.stringify({
              photoId: fileData.id // Kirim ID file
            })
          });

          if (!updateResponse.ok) {
             const errorBody = await updateResponse.json();
             console.error('Gagal update profil:', errorBody);
             throw new Error('Update profil gagal');
          }

          // 5. Jika semua berhasil, perbarui gambar di halaman secara instan
          profilePic.src = fileData.path; 

        } catch (error) {
          console.error('Gagal mengganti foto profil:', error);
          alert('Gagal mengganti foto profil. Silakan coba lagi.');
        } finally {
          // Hentikan status loading
          profilePic.classList.remove('loading');
          fileInput.value = ''; // Reset input file agar bisa upload file yg sama
        }
      }
    });
  }
  // ===================================================================
  // 👆 AKHIR: Fungsionalitas Upload Foto Profil 👆
  // ===================================================================

  // Show selected image name (untuk form create-post)
  const mediaInput = document.getElementById('media');
  if (mediaInput) {
    mediaInput.addEventListener('change', function() {
      const fileName = this.files[0]?.name;
      const label = this.previousElementSibling; // Asumsi label tepat sebelum input
      if (fileName && label) {
        // Asumsi label punya ikon, kita ganti teksnya saja
        label.textContent = ` File terpilih: ${fileName}`; 
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