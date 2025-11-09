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

  // Show tiny thumbnail preview for selected media (create-post)
  const mediaInput = document.getElementById('media');
  if (mediaInput) {
    mediaInput.addEventListener('change', function() {
      const file = this.files && this.files[0] ? this.files[0] : null;
      const preview = document.getElementById('mediaPreview');
      const labelText = document.getElementById('mediaLabelText');
      const clearBtn = document.getElementById('mediaClear');
      if (!preview) return;

      // Reset preview
      preview.innerHTML = '';
      preview.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      if (labelText) labelText.textContent = 'Tambah Media';

      if (!file) return;

      if (file.type && file.type.startsWith('image/')) {
        const img = document.createElement('img');
        const url = URL.createObjectURL(file);
        img.src = url;
        img.onload = () => URL.revokeObjectURL(url);
        preview.appendChild(img);
        preview.style.display = 'inline-flex';
      } else if (file.type && file.type.startsWith('video/')) {
        // For video, show a tiny video icon instead of heavy preview
        const icon = document.createElement('i');
        icon.className = 'fas fa-video';
        preview.appendChild(icon);
        preview.style.display = 'inline-flex';
      }
      // Update label to 'Ubah Media' & show clear button
      if (labelText) labelText.textContent = 'Ubah Media';
      if (clearBtn) clearBtn.style.display = 'inline-flex';
    });
  }
  // Media clear button functionality
  const clearBtnGlobal = document.getElementById('mediaClear');
  if (clearBtnGlobal && mediaInput) {
    clearBtnGlobal.addEventListener('click', () => {
      mediaInput.value = '';
      const preview = document.getElementById('mediaPreview');
      const labelText = document.getElementById('mediaLabelText');
      if (preview) {
        preview.innerHTML = '';
        preview.style.display = 'none';
      }
      if (labelText) labelText.textContent = 'Tambah Media';
      clearBtnGlobal.style.display = 'none';
    });
  }

  // Reply button functionality (improved: hide button when active, restore others)
  const replyButtons = document.querySelectorAll('.js-reply-button');
  let activeReplyForm = null;
  let activeReplyButton = null;

  replyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const commentId = button.dataset.commentId;
      const replyForm = document.getElementById(`reply-form-${commentId}`);
      if (!replyForm) return;

      // If clicking a different reply, close previous & show its button again
      if (activeReplyForm && activeReplyForm !== replyForm) {
        activeReplyForm.style.display = 'none';
        if (activeReplyButton) activeReplyButton.style.display = 'inline-flex';
      }

      // Toggle current
      const isOpening = replyForm.style.display === 'none' || replyForm.style.display === '';
      if (isOpening) {
        // Hide this button, show form
        button.style.display = 'none';
        replyForm.style.display = 'flex';
        activeReplyForm = replyForm;
        activeReplyButton = button;
        // Focus input inside form
        const input = replyForm.querySelector('input[name="content"]');
        if (input) setTimeout(() => input.focus(), 40);
      } else {
        // Close current form & show button again
        replyForm.style.display = 'none';
        button.style.display = 'inline-flex';
        activeReplyForm = null;
        activeReplyButton = null;
      }
    });
  });

  // Theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const currentTheme = localStorage.getItem('theme');
  // Lucide SVG icons (inline) for moon & sun
  const moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  // Logo switching logic
  const logoElements = document.querySelectorAll('[data-logo]');
  const setLogosForTheme = (isDark) => {
    logoElements.forEach(el => {
      const darkSrc = el.getAttribute('data-logo-dark');
      const lightSrc = el.getAttribute('data-logo-light');
      el.src = isDark ? darkSrc : lightSrc;
    });
  };

  // 1. Terapkan tema dari localStorage saat halaman dimuat
  const themeIcon = document.getElementById('theme-icon');
  if (currentTheme === 'dark') {
    body.classList.add('dark');
    setLogosForTheme(true);
    if (themeIcon) {
      themeIcon.innerHTML = sunSvg;
      themeIcon.classList.remove('text-foreground');
      themeIcon.classList.add('text-accent');
    }
  } else {
    setLogosForTheme(false);
    if (themeIcon) themeIcon.innerHTML = moonSvg;
  }

  // 2. Tambahkan event listener ke tombol
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDark = body.classList.contains('dark');
      if (themeIcon) {
        themeIcon.innerHTML = isDark ? sunSvg : moonSvg;
        themeIcon.classList.toggle('text-accent', isDark);
        themeIcon.classList.toggle('text-foreground', !isDark);
      }
      setLogosForTheme(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // ------------------------------------------------------------
  // Mobile search dropdown (appears under navbar)
  // ------------------------------------------------------------
  const mobileSearchBtn = document.getElementById('mobileSearchBtn');
  const mobileSearchPanel = document.getElementById('mobileSearchPanel');
  const mobileSearchClose = document.getElementById('mobileSearchClose');
  let mobileSearchOpen = false;

  function openMobileSearch() {
    if (!mobileSearchPanel) return;
    mobileSearchPanel.style.opacity = '1';
    mobileSearchPanel.style.transform = 'scaleY(1)';
    mobileSearchPanel.style.pointerEvents = 'auto';
    mobileSearchOpen = true;
    setTimeout(() => {
      const input = mobileSearchPanel.querySelector('input[type="search"]');
      if (input) input.focus();
    }, 75);
    document.addEventListener('click', handleOutsideClickMobileSearch);
  }

  function closeMobileSearch() {
    if (!mobileSearchPanel) return;
    mobileSearchPanel.style.opacity = '0';
    mobileSearchPanel.style.transform = 'scaleY(0)';
    mobileSearchPanel.style.pointerEvents = 'none';
    mobileSearchOpen = false;
    document.removeEventListener('click', handleOutsideClickMobileSearch);
  }

  function handleOutsideClickMobileSearch(e) {
    if (!mobileSearchPanel || !mobileSearchBtn) return;
    // Allow clicks on the button or any of its child elements (icon SVG/i)
    if (mobileSearchBtn.contains(e.target)) return;
    if (!mobileSearchPanel.contains(e.target)) {
      closeMobileSearch();
    }
  }

  if (mobileSearchBtn && mobileSearchPanel) {
    mobileSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (mobileSearchOpen) {
        closeMobileSearch();
      } else {
        openMobileSearch();
      }
      // Sync icon colors in case Tailwind dark class toggled after initial render
      applySearchIconThemeColors();
    });
  }
  if (mobileSearchClose) {
    mobileSearchClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileSearch();
      // Refocus button to allow immediate re-open on next click
      if (mobileSearchBtn) mobileSearchBtn.focus();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSearchOpen) {
      closeMobileSearch();
    }
  });

  // ------------------------------------------------------------
  // Comment toggle (show/hide comment area per post)
  // ------------------------------------------------------------
  const commentToggleButtons = document.querySelectorAll('.js-comment-toggle');
  commentToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.getAttribute('data-post-id');
      if (!postId) return;
      const wrapper = document.querySelector(`.js-comments-wrapper[data-post-id="${postId}"]`);
      if (!wrapper) return;
      const isHidden = wrapper.style.display === 'none' || wrapper.style.display === '';
      wrapper.style.display = isHidden ? 'block' : 'none';
      if (!isHidden) {
        // If hiding the comments area, also reset any active reply UI inside it
        try {
          if (typeof activeReplyForm !== 'undefined' && activeReplyForm && wrapper.contains(activeReplyForm)) {
            activeReplyForm.style.display = 'none';
            if (typeof activeReplyButton !== 'undefined' && activeReplyButton) {
              activeReplyButton.style.display = 'inline-flex';
            }
          }
        } catch (_) {}
        return;
      }
      // focus input when opening
      const input = wrapper.querySelector('input[name="content"]');
      if (input) setTimeout(() => input.focus(), 60);
    });
  });

  // ------------------------------------------------------------
  // Ensure search icons adapt to theme (fallback if Tailwind purge)
  // ------------------------------------------------------------
  function applySearchIconThemeColors() {
    const isDark = document.body.classList.contains('dark');
    const searchIcons = document.querySelectorAll('#mobileSearchBtn i.fas.fa-search, #mobileSearchPanel i.fas.fa-search, header .main-nav form i.fas.fa-search');
    searchIcons.forEach(ic => {
      ic.style.color = isDark ? '#ffffff' : '#1e293b';
    });
    const closeIcon = document.querySelector('#mobileSearchClose i.fas.fa-times');
    if (closeIcon) closeIcon.style.color = isDark ? '#ffffff' : '#1e293b';
  }
  // Initial invocation
  applySearchIconThemeColors();
  // Also tie into theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(applySearchIconThemeColors, 60);
    });
  }
  // ------------------------------------------------------------
  // Post options menu (owner-only kebab)
  // ------------------------------------------------------------
  const menuButtons = document.querySelectorAll('.js-post-menu-btn');
  let openMenu = null;
  function closeOpenMenu() {
    if (openMenu) {
      openMenu.style.display = 'none';
      const btn = document.querySelector(`.js-post-menu-btn[data-post-id="${openMenu.getAttribute('data-post-id')}"]`);
      if (btn) btn.setAttribute('aria-expanded', 'false');
      openMenu = null;
      document.removeEventListener('click', handleOutsideClickMenu);
    }
  }
  function handleOutsideClickMenu(e) {
    if (!openMenu) return;
    const btn = document.querySelector(`.js-post-menu-btn[data-post-id="${openMenu.getAttribute('data-post-id')}"]`);
    if (btn && (btn.contains(e.target) || openMenu.contains(e.target))) return;
    closeOpenMenu();
  }
  menuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const postId = btn.getAttribute('data-post-id');
      const menu = document.querySelector(`.js-post-menu[data-post-id="${postId}"]`);
      if (!menu) return;
      const isHidden = menu.style.display === 'none' || menu.style.display === '';
      // Close others first
      closeOpenMenu();
      if (isHidden) {
        menu.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        openMenu = menu;
        setTimeout(() => document.addEventListener('click', handleOutsideClickMenu), 0);
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape') closeOpenMenu();
        }, { once: true });
      }
    });
  });
  // Delete action
  const deleteButtons = document.querySelectorAll('.js-post-delete');
  deleteButtons.forEach(delBtn => {
    delBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const postId = delBtn.getAttribute('data-post-id');
      if (!postId) return;
      const confirmed = window.confirm('Yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan.');
      if (!confirmed) return;
      try {
        const base = window.location.origin;
        const url = `${base}/api/v1/posts/${postId}/delete`;
        const resp = await fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' }, credentials: 'same-origin', redirect: 'manual' });
        // Anggap redirect sebagai sukses (server memang redirect ke '/')
        const isRedirect = resp.type === 'opaqueredirect' || (resp.status >= 300 && resp.status < 400);
        const isSuccess = resp.ok || isRedirect;
        if (!isSuccess) {
          const text = await resp.text();
          throw new Error(text || 'Gagal menghapus postingan');
        }
        // Optional: jika ingin hard reload setelah hapus, bisa aktifkan ini:
        // if (isRedirect) { window.location.href = '/'; return; }
        const card = document.querySelector(`.post-item[data-post-id="${postId}"]`);
        if (card) {
          card.style.transition = 'opacity .25s ease, transform .25s ease';
          card.style.opacity = '0';
          card.style.transform = 'scale(.96)';
          setTimeout(() => card.remove(), 260);
        }
        closeOpenMenu();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus postingan.');
      }
    });
  });

  // ------------------------------------------------------------
  // Comment/reply menu & delete actions
  // ------------------------------------------------------------
  const commentMenuButtons = document.querySelectorAll('.js-comment-menu-btn');
  let openCommentMenu = null;
  function closeOpenCommentMenu() {
    if (openCommentMenu) {
      openCommentMenu.style.display = 'none';
      const btn = document.querySelector(`.js-comment-menu-btn[data-comment-id="${openCommentMenu.getAttribute('data-comment-id')}"]`);
      if (btn) btn.setAttribute('aria-expanded', 'false');
      openCommentMenu = null;
      document.removeEventListener('click', handleOutsideClickCommentMenu);
    }
  }
  function handleOutsideClickCommentMenu(e) {
    if (!openCommentMenu) return;
    const btn = document.querySelector(`.js-comment-menu-btn[data-comment-id="${openCommentMenu.getAttribute('data-comment-id')}"]`);
    if (btn && (btn.contains(e.target) || openCommentMenu.contains(e.target))) return;
    closeOpenCommentMenu();
  }
  commentMenuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const commentId = btn.getAttribute('data-comment-id');
      const menu = document.querySelector(`.js-comment-menu[data-comment-id="${commentId}"]`);
      if (!menu) return;
      const isHidden = menu.style.display === 'none' || menu.style.display === '';
      closeOpenCommentMenu();
      if (isHidden) {
        menu.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        openCommentMenu = menu;
        setTimeout(() => document.addEventListener('click', handleOutsideClickCommentMenu), 0);
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape') closeOpenCommentMenu();
        }, { once: true });
      }
    });
  });

  const commentDeleteButtons = document.querySelectorAll('.js-comment-delete');
  commentDeleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const commentId = btn.getAttribute('data-comment-id');
      if (!commentId) return;
      const ok = window.confirm('Yakin ingin menghapus komentar ini?');
      if (!ok) return;
      try {
        const base = window.location.origin;
        const url = `${base}/api/v1/comments/${commentId}/delete`;
        const resp = await fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' }, credentials: 'same-origin', redirect: 'manual' });
        const isRedirect = resp.type === 'opaqueredirect' || (resp.status >= 300 && resp.status < 400);
        const isSuccess = resp.ok || isRedirect;
        if (!isSuccess) {
          const text = await resp.text();
          throw new Error(text || 'Gagal menghapus komentar');
        }
        const item = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
        if (item) {
          item.style.transition = 'opacity .25s ease, transform .25s ease';
          item.style.opacity = '0';
          item.style.transform = 'scale(.98)';
          setTimeout(() => {
            item.remove();
            // Hitung ulang jumlah komentar utama berbasis DOM agar akurat
            const postCard = btn.closest('.post-item');
            if (postCard) {
              const countSpan = postCard.querySelector('.comment-count');
              const komentarHeading = postCard.querySelector('.js-comments-title');
              const topLevelComments = postCard.querySelectorAll('.comment-list > .comment-item');
              const newCount = topLevelComments ? topLevelComments.length : 0;
              if (countSpan) countSpan.textContent = String(newCount);
              if (komentarHeading) {
                komentarHeading.style.display = newCount === 0 ? 'none' : '';
              }
            }
          }, 260);
        }
        closeOpenCommentMenu();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus komentar.');
      }
    });
  });
});