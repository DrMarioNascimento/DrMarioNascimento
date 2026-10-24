/* Progressive enhancements: the catalog and all activity links work without JS. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const top = $('#topo'), menu = $('#menuToggle');
  const exploring = () => document.body.classList.contains('explorando');
  const leaveUniverse = () => { if (exploring()) $('#sairExplorar').click(); };
  const insideOverlay = target => target.closest('#painel, .paleta, .zoom, .topo');
  // Returning to #inicio must exit even when the document is already at y=0.
  document.addEventListener('click', e => {
    if (e.target.closest('#topo a[href^="#"]')) leaveUniverse();
  });
  document.addEventListener('wheel', e => {
    if (!exploring() || !e.deltaY || e.ctrlKey || insideOverlay(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    leaveUniverse();
    const distance = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    scrollBy({top:distance, behavior:'instant'});
  }, {capture:true, passive:false});
  // On the lightweight map, vertical swipes resume page scrolling.
  // In 3D, keep the existing drag-to-rotate and pinch gestures.
  let swipe = null;
  document.addEventListener('touchstart', e => {
    swipe = exploring() && document.documentElement.classList.contains('universo-leve') && e.touches.length === 1 && !insideOverlay(e.target)
      ? {x:e.touches[0].clientX, y:e.touches[0].clientY} : null;
  }, {passive:true});
  document.addEventListener('touchmove', e => {
    if (!swipe || e.touches.length !== 1) {swipe = null; return;}
    const dy = swipe.y-e.touches[0].clientY, dx = swipe.x-e.touches[0].clientX;
    if (Math.abs(dy) < 32 || Math.abs(dy) <= Math.abs(dx)*1.3) return;
    e.preventDefault(); e.stopPropagation(); swipe = null;
    leaveUniverse(); scrollBy({top:dy, behavior:'instant'});
  }, {capture:true, passive:false});
  document.addEventListener('touchend', () => {swipe = null;}, {passive:true});
  document.addEventListener('touchcancel', () => {swipe = null;}, {passive:true});
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
    const en = document.documentElement.lang === 'en';
    const ready = window.U?.cenaPronta && !window.U?.cenaFalhou;
    $('#explorar').textContent = en ? 'Explore the project universe ↗' : 'Explorar o universo de projetos ↗';
    $('.universe-hint').hidden = false;
    $('.universe-hint').textContent = ready
      ? (en ? 'Drag to rotate · scroll or choose Home to leave' : 'Arraste para girar · role ou clique em Início para sair')
      : (en ? 'Tap a planet · scroll or choose Home to leave' : 'Toque em um planeta · role ou clique em Início para sair');
  }
  document.addEventListener('universo-indisponivel', universeStatus);
  document.addEventListener('universo-pronto', universeStatus);
  document.addEventListener('lang', () => { universeStatus(); filter(active, false); });
  universeStatus();
})();
