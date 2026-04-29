// Portal JavaScript — mobile nav toggle and project count display
(function () {
  'use strict';

  // Project count — runs after script.js has rendered cards
  var projectCount = document.getElementById('project-count');

  function updateCount(visible, total) {
    if (projectCount) {
      projectCount.textContent = 'Showing ' + visible + ' of ' + total + ' samples';
    }
  }

  // Hook into filter clicks to keep count in sync (cards loaded async by script.js)
  document.querySelectorAll('.gp-filter-button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTimeout(function () {
        var all     = document.querySelectorAll('.gp-project-card');
        var visible = document.querySelectorAll('.gp-project-card:not(.gp-hidden)');
        updateCount(visible.length, all.length);
      }, 0);
    });
  });

  // Mobile nav toggle
  var toggle = document.querySelector('.gp-mobile-menu-toggle');
  var nav    = document.querySelector('.gp-header-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
