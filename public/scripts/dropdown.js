
// Mobile drawer toggle
// The hamburger button opens and closes the off-canvas drawer.
// This is the single source of truth for that behaviour so the
// HTML files do not need their own inline scripts.


const hamburger = document.getElementById('hamburger');
const mobileDrawer = document.getElementById('mobileDrawer');

hamburger?.addEventListener('click', (e) => {
  e.stopPropagation();
  mobileDrawer?.classList.toggle('open');
});

// Close the drawer when any link inside it is tapped
mobileDrawer?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileDrawer.classList.remove('open');
  });
});

// Close the drawer when the user taps outside of it
document.addEventListener('click', (e) => {
  if (
    mobileDrawer?.classList.contains('open') &&
    !mobileDrawer.contains(e.target) &&
    e.target !== hamburger
  ) {
    mobileDrawer.classList.remove('open');
  }
});


// Desktop dropdown menus in the navbar (e.g. Types menu)


document.querySelectorAll('.navbar__dropdown').forEach(dropdown => {
  const btn = dropdown.querySelector('.navbar__dropdown-btn');
  const menu = dropdown.querySelector('.navbar__dropdown-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close any other open menus first
    document.querySelectorAll('.navbar__dropdown-menu.open').forEach(m => {
      if (m !== menu) m.classList.remove('open');
    });
    menu.classList.toggle('open');
  });
});

// Close desktop dropdowns when clicking anywhere else on the page
document.addEventListener('click', () => {
  document.querySelectorAll('.navbar__dropdown-menu.open').forEach(menu => {
    menu.classList.remove('open');
  });
});