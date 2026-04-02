// Portal JavaScript — gateway filter, mobile nav, project count
(function () {
  'use strict';

  // Gateway filter
  const filterButtons = document.querySelectorAll('.gp-filter-button');
  const projectCards = document.querySelectorAll('.gp-project-card');
  const projectCount = document.getElementById('project-count');

  function updateCount(visible) {
    if (projectCount) {
      projectCount.textContent = 'Showing ' + visible + ' of ' + projectCards.length + ' samples';
    }
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;

      filterButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var visible = 0;
      projectCards.forEach(function (card) {
        var category = card.dataset.category;
        var show = filter === 'all' || category === filter;
        card.classList.toggle('hidden', !show);
        if (show) visible++;
      });

      updateCount(visible);
    });
  });

  // Initial count
  updateCount(projectCards.length);

  // Mobile nav toggle
  var toggle = document.querySelector('.gp-mobile-menu-toggle');
  var nav = document.querySelector('.gp-header-nav');

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
