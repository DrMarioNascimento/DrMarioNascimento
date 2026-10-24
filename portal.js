/* Progressive enhancements: the catalog and all activity links work without JS. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const top = $('#topo'), menu = $('#menuToggle');
  function closeMenu(restoreFocus = false) {
    top.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    top.classList.toggle('menu-open', open); menu.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (!top.contains(e.target) || e.target.closest('#nav a')) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
      if (document.body.classList.contains('explorando')) {
        $('#sairExplorar').click(); $('#explorar').focus();
      }
    }
  });
  matchMedia('(min-width:1021px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  const filters = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.discovery-card')];
  let active = 'all';
  function filter(value, announce = true) {
    active = value;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
    cards.forEach(c => { c.hidden = value !== 'all' && c.dataset.category !== value; });
    if (announce) {
      const count = cards.filter(c => !c.hidden).length;
      $('#filter-status').textContent = document.documentElement.lang === 'en'
        ? `${count} experiences shown.` : `${count} experiências exibidas.`;
    }
  }
  filters.forEach(b => b.addEventListener('click', () => filter(b.dataset.filter)));
  $('.discovery-filters').hidden = false;
  function revealTarget(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target?.matches('.discovery-card') && target.hidden) filter('all', false);
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (link) revealTarget(link.getAttribute('href'));
  });
  addEventListener('hashchange', () => revealTarget(location.hash));
  revealTarget(location.hash);

  function universeStatus() {
    const failed = window.U?.cenaFalhou;
    const ready = window.U?.cenaPronta && !failed;
    const en = document.documentElement.lang === 'en';
    $('#explorar').textContent = ready
      ? (en ? 'Explore the project universe ↗' : 'Explorar o universo de projetos ↗')
      : (en ? 'Explore the complete catalog ↗' : 'Explorar o catálogo completo ↗');
    $('.universe-hint').hidden = !ready;
  }
  document.addEventListener('universo-indisponivel', universeStatus);
  document.addEventListener('universo-pronto', universeStatus);
  document.addEventListener('lang', () => { universeStatus(); filter(active, false); });
  universeStatus();
})();
