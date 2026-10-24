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

  function render() {
    root.setAttribute('aria-label', say('Universo de projetos', 'Project universe'));
    root.innerHTML = `<div class="lite-systems">${groups.map(g => {
      const r = central(g);
      const satellites = U.repos.filter(p => (p.grupo === g || p.grupos?.includes(g)) && p !== r);
      return `<div class="lite-system" style="--planet:${esc(r.cor)}">
        <div class="lite-orbit">${satellites.map((p, i) => `<button type="button" class="lite-satellite" data-planet="${U.repos.indexOf(p)}" aria-label="${esc(p.nome)}" title="${esc(p.nome)}" style="left:${50 + 49 * Math.cos(i * 2 * Math.PI / satellites.length)}%;top:${50 + 49 * Math.sin(i * 2 * Math.PI / satellites.length)}%;--satellite:${esc(p.cor)}"><span aria-hidden="true"></span><span class="satellite-name">${esc(p.nome)}</span></button>`).join('')}</div>
        <button class="lite-planet" type="button" data-group="${g}" aria-label="${esc(text(U.grupos[g]))}"><span class="lite-sphere" aria-hidden="true"></span><strong>${esc(text(U.grupos[g]))}</strong><small>${say('Explorar projetos', 'Explore projects')} ↗</small></button>
      </div>`;
    }).join('')}</div><p class="lite-caption">${say('Toque em um planeta para explorar.', 'Tap a planet to explore.')}</p>`;
    root.querySelectorAll('[data-planet]').forEach(button => button.addEventListener('click', () => {
      returnFocus = button;
      openRepo(+button.dataset.planet);
    }));
    root.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => {
      returnFocus = button;
      openGroup(button.dataset.group);
    }));
  }
  function show(color, html, moveFocus) {
    scrollTo({top:0, behavior:'instant'});
    U.explorar = true;
    document.body.classList.add('explorando');
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
  new MutationObserver(() => {root.inert = !U.explorar;}).observe(document.body, {attributes:true, attributeFilter:['class']});
  root.inert = !U.explorar;
  render();
  sync();
})();
