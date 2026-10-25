/* Navigation stays available while 3D loads or when WebGL is unavailable.
   Uses the same catalog as the original scene; no external dependencies. */
(() => {
  'use strict';
  const U = window.U;
  if (!U) return;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = o => typeof o === 'object' && o ? (U.lang === 'en' ? o.en ?? o.pt : o.pt) : o;
  const say = (pt, en) => U.lang === 'en' ? en : pt;
  const groups = ['aula', 'etica', 'dragon', 'lab'];
  const central = g => U.repos.find(r => r.grupo === g && !r.grupos && !('pai' in r));
  const root = document.createElement('nav');
  root.className = 'universe-lite';
  document.body.insertBefore(root, $('#universo'));
  const panel = $('#painel'), content = $('#painelCorpo');
  let selected = null, returnFocus = null;
  const active = () => !U.cenaPronta || U.cenaFalhou;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let orbiters = [], frameId = null, lastFrame = 0, elapsed = 0;
  function animate(now) {
    frameId = null;
    if (!active() || root.hidden || document.hidden || reducedMotion.matches || (!U.explorar && document.body.classList.contains('past-universe-hero'))) return;
    if (!lastFrame) lastFrame = now;
    const dt = Math.min(.06, Math.max(0, (now-lastFrame)/1000));
    if (now-lastFrame >= 1000/30) {
      lastFrame = now; elapsed += dt;
      orbiters.forEach(orbiter => {
        if (orbiter.held) return;
        orbiter.angle += dt * .12;
        orbiter.button.style.left = (50 + 49*Math.cos(orbiter.angle)) + '%';
        orbiter.button.style.top = (50 + 49*Math.sin(orbiter.angle)) + '%';
      });
    }
    frameId = requestAnimationFrame(animate);
  }
  function resume() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null; lastFrame = 0;
    if (active() && !reducedMotion.matches && !document.hidden) frameId = requestAnimationFrame(animate);
  }

  function render() {
    root.setAttribute('aria-label', say('Universo de projetos', 'Project universe'));
    root.innerHTML = `<div class="lite-systems">${groups.map(g => {
      const r = central(g);
      const satellites = U.repos.filter(p => (p.grupo === g || p.grupos?.includes(g)) && p !== r);
      return `<div class="lite-system" style="--planet:${esc(r.cor)}">
        <div class="lite-orbit">${satellites.map((p, i) => `<button type="button" class="lite-satellite" data-planet="${U.repos.indexOf(p)}" aria-label="${esc(p.nome)}" title="${esc(p.nome)}" style="left:${50 + 49 * Math.cos(i * 2 * Math.PI / satellites.length)}%;top:${50 + 49 * Math.sin(i * 2 * Math.PI / satellites.length)}%;--satellite:${esc(p.cor)}"><span aria-hidden="true"></span><span class="satellite-name">${esc(p.nome)}</span></button>`).join('')}</div>
        <button class="lite-planet" type="button" data-group="${g}" aria-label="${esc(text(U.grupos[g]))}"><span class="lite-sphere" aria-hidden="true"></span><strong>${esc(text(U.grupos[g]))}</strong><small>${say('Explorar projetos', 'Explore projects')} ↗</small></button>
      </div>`;
    }).join('')}</div><p class="lite-caption">${say('Toque em um planeta para explorar. Role ou clique em Início para sair.', 'Tap a planet to explore. Scroll or choose Home to leave.')}</p>`;
    root.querySelectorAll('[data-planet]').forEach(button => button.addEventListener('click', () => {
      returnFocus = button;
      openRepo(+button.dataset.planet);
    }));
    root.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => {
      returnFocus = button;
      openGroup(button.dataset.group);
    }));
    orbiters = [];
    root.querySelectorAll('.lite-orbit').forEach(orbit => {
      const buttons = [...orbit.querySelectorAll('.lite-satellite')];
      buttons.forEach((button, i) => {
        const orbiter = {button, angle:i*2*Math.PI/buttons.length + elapsed*.12, held:false};
        button.addEventListener('pointerenter', () => {orbiter.held = true;});
        button.addEventListener('pointerleave', () => {orbiter.held = false;});
        button.addEventListener('focus', () => {orbiter.held = true;});
        button.addEventListener('blur', () => {orbiter.held = false;});
        orbiters.push(orbiter);
      });
    });
    resume();
  }
  function show(color, html, moveFocus) {
    U.entrarUniverso();
    panel.style.setProperty('--c', color);
    content.innerHTML = html;
    panel.classList.add('aberto');
    panel.setAttribute('aria-hidden', 'false');
    panel.scrollTop = 0;
    if (moveFocus) $('#fechaPainel').focus({preventScroll:true});
  }
  function openGroup(g, moveFocus = true) {
    selected = {g};
    const repos = U.repos.map((r, k) => ({r, k})).filter(({r}) => r.grupo === g || r.grupos?.includes(g));
    show(central(g).cor, `<span class="mono">${say('Sistema', 'System')}</span><h3>${esc(text(U.grupos[g]))}</h3><p class="lema">${esc(text(U.grupos[g].sub))}</p><ul class="lst">${repos.map(({r, k}) => `<li><a href="${esc(r.online)}" data-repo="${k}">${esc(r.nome)}<span>${say('Explorar', 'Explore')} ↗</span></a></li>`).join('')}</ul>`, moveFocus);
    content.querySelectorAll('[data-repo]').forEach(a => a.addEventListener('click', e => {e.preventDefault(); openRepo(+a.dataset.repo);}));
  }
  function openRepo(k, moveFocus = true) {
    const r = U.repos[k];
    if (!r) return;
    selected = {k};
    const items = U.itens.filter(it => it[0] === k);
    show(r.cor, `<span class="mono">${esc(text(r.area))}</span><h3>${esc(r.nome)}</h3><p class="lema">${esc(r.tag || text(r.lema))}</p><p>${esc(text(r.desc))}</p>
      <div class="bts"><a class="btn cheio" href="${esc(r.online)}" target="_blank" rel="noopener">${say('Abrir site', 'Open site')} ↗</a><button type="button" class="btn" data-back>${say('Voltar ao sistema', 'Back to system')}</button></div>
      <ul class="lst">${items.map(it => `<li><a href="${esc(it[3])}" target="_blank" rel="noopener">${esc(it[1])}<span>${esc(U.tipos[it[4]]?.[U.lang === 'en' ? 1 : 0] || '')} ↗</span></a></li>`).join('')}</ul>`, moveFocus);
    content.querySelector('[data-back]').addEventListener('click', () => openGroup(r.grupo));
  }
  function close() {
    if (!selected) return;
    selected = null;
    panel.classList.remove('aberto');
    panel.setAttribute('aria-hidden', 'true');
    if (U.explorar) returnFocus?.focus({preventScroll:true});
  }
  function sync() {
    const enabled = active();
    document.documentElement.classList.toggle('universo-leve', enabled);
    root.hidden = !enabled;
    if (!enabled) close();
    resume();
  }
  $('#fechaPainel').addEventListener('click', close);
  document.addEventListener('fecha-foco', close);
  document.addEventListener('foca', e => {if (active()) openRepo(e.detail);});
  document.addEventListener('universo-pronto', sync);
  document.addEventListener('universo-indisponivel', sync);
  document.addEventListener('lang', () => {
    render();
    if (selected?.g) openGroup(selected.g, false);
    else if (selected) openRepo(selected.k, false);
  });
  document.addEventListener('visibilitychange', resume);
  document.addEventListener('universo-entrar', resume);
  addEventListener('pageshow', resume);
  addEventListener('focus', resume);
  reducedMotion.addEventListener('change', resume);
  new MutationObserver(resume).observe(document.body, {attributes:true, attributeFilter:['class']});
  render();
  sync();
})();
