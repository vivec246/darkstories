/* СОБЫТИЯ: клики, поиск, скролл, клавиши. */

document.addEventListener('click', function (e) {
  var t = e.target;
  function up(sel) { return t.closest ? t.closest(sel) : null; }
  var el;
  var fpop = $('#fontpop');
  if (fpop && !fpop.hidden && !up('#fontpop') && !up('[data-act="font"]')) fpop.hidden = true;
  if ((el = up('.hero-dot'))) {
    showHeroSlide(Number(el.getAttribute('data-slide')));
    startHero(); /* после ручного выбора автолистание отсчитывает 5 секунд заново */
    return;
  }
  if (up('#backToTopBtn')) {
    var hero = $('.hero');
    window.scrollTo({ top: hero ? hero.offsetHeight - 1 : 0, behavior: 'smooth' });
    return;
  }
  if ((el = up('[data-goto]'))) {
    e.preventDefault();
    var tgt = document.getElementById(el.getAttribute('data-goto')); if (tgt) tgt.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if ((el = up('[data-goto-id]'))) {
    var id = el.getAttribute('data-goto-id'), node = document.getElementById(id);
    if (el.hasAttribute('data-close')) closeDialog();
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if ((el = up('[data-fav]'))) {
    var slug = el.getAttribute('data-fav'); Store.toggleFav(slug);
    var on = Store.isFav(slug);
    if (parseHash().path === '/') {
      /* на главной обновляем полку и рекомендации, шапку и меню не трогаем */
      var mainEl = $('#main'); if (mainEl) mainEl.innerHTML = PAGES['/'].render();
      initCardAnimation();
      toast(on ? 'Добавлено на вашу полку' : 'Убрано с полки');
      return;
    }
    $$('[data-fav="' + slug + '"]').forEach(function (b) {
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Убрать с полки' : 'Добавить на полку');
    });
    toast(on ? 'Добавлено на вашу полку' : 'Убрано с полки');
    return;
  }
  if ((el = up('[data-desc]'))) {
    el.closest('.card').classList.toggle('desc-open'); return;
  }
  if ((el = up('.card[data-href]')) && !up('a, button')) { location.hash = el.getAttribute('data-href'); return; }
  if ((el = up('[data-amount]'))) {
    var a = el.getAttribute('data-amount');
    copyText('Здравствуйте, ' + SITE.author + '! Хочу поддержать Dark Stories на ' + a + ' ₽.')
      .then(function () { toast('Текст скопирован. Отправьте его в Telegram или письмом — без номера карты на сайте.'); })
      .catch(function () { toast('Не удалось скопировать. Напишите в Telegram вручную.'); });
    return;
  }
  if (up('#qclear')) { var q = $('#q'); q.value = ''; closeResults(); q.focus(); return; }
  if (up('.results a')) { closeResults(); var qi = $('#q'); if (qi) qi.value = ''; return; }
  if (!up('.search')) closeResults();

  if ((el = up('[data-bm-del]'))) { Store.removeBookmark(R.work.slug, el.getAttribute('data-bm-del')); openDialog('bookmarks'); return; }
  if ((el = up('[data-bm-go]'))) { window.scrollTo({ top: Number(el.getAttribute('data-bm-go')), behavior: 'smooth' }); closeDialog(); return; }
  if (t.hasAttribute && t.hasAttribute('data-bgclose')) { closeDialog(); return; }
  if (up('[data-close]')) { closeDialog(); return; }

  /* на телефоне касание по тексту прячет/показывает кнопки (как в версии 3) */
  if (R && window.innerWidth <= 768 && up('#reader') && !up('.rtools, .share, .v3modal, [data-act]') && !String(window.getSelection() || '').trim()) {
    toggleControls();
    return;
  }

  if ((el = up('[data-act]')) && R) {
    var act = el.getAttribute('data-act'), w = R.work;
    if (act === 'close') { location.hash = returnHash || (w.kind === 'article' ? '#/articles' : '#/'); }
    else if (act === 'theme') {
      var n = !Store.s.readerNight; Store.setNight(n);
      var rd = $('#reader'); rd.classList.toggle('night', n); rd.classList.toggle('day', !n);
    }
    else if (act === 'bookmarks') openDialog('bookmarks');
    else if (act === 'toc') openDialog('toc');
    else if (act === 'font') { var fp = $('#fontpop'); fp.hidden = !fp.hidden; }
    else if (act === 'share') {
      var url = location.origin + location.pathname + '#/read/' + w.slug;
      if (navigator.share) navigator.share({ title: w.title, url: url }).catch(function () {});
      else copyText(url).then(function () { toast('Ссылка скопирована — можно отправлять'); }).catch(function () { toast(url); });
    }
    else if (act === 'bm-save') {
      Store.addBookmark(w.slug, { text: w.title, pos: window.scrollY });
      toast('Закладка сохранена'); openDialog('bookmarks');
    }
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (contextMenuOpen()) { hideContextMenu(); return; }
    if (quoteShareOpen()) { closeQuoteShare(); return; }
    if ($('#overlay-root .v3modal')) { closeDialog(); return; }
    var rs = $('#results'); if (rs && !rs.hidden) { closeResults(); return; }
    if (R) location.hash = returnHash || (R.work.kind === 'article' ? '#/articles' : '#/');
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('card') && e.target.getAttribute('data-href')) {
    e.preventDefault(); location.hash = e.target.getAttribute('data-href');
  }
});

document.addEventListener('input', function (e) {
  if (e.target.id === 'fontrange') {
    var v = Number(e.target.value); Store.setFont(v); applyFont();
  }
  if (e.target.id === 'q') runSearch(e.target.value);
});
document.addEventListener('focusin', function (e) {
  if (e.target.id === 'q') { loadAllBodies().then(function () { var q = $('#q'); if (q && q.value) runSearch(q.value); }); runSearch(e.target.value); }
});
function closeResults() { var r = $('#results'); if (r) { r.hidden = true; r.innerHTML = ''; } }
function runSearch(value) {
  var clear = $('#qclear'), ic = $('#qicon'), box = $('#results');
  if (!box) return;
  if (clear) clear.hidden = !value; if (ic) ic.hidden = !!value;
  var q = value.trim();
  if (q.length < 2) { closeResults(); return; }
  var hits = searchWorks(q);
  box.hidden = false;
  box.innerHTML = '<p class="head">' + (hits.length ? 'Найдено: ' + hits.length : 'Ничего не найдено') + '</p>' + hits.map(function (h) {
    return '<a href="#/read/' + h.w.slug + '?q=' + encodeURIComponent(q) + '"><p class="t">' + esc(h.w.title) + ' <small>' + (h.w.kind === 'story' ? 'Рассказ' : 'Статья') + '</small></p><p class="s">' + hl(h.snippet, q) + '</p></a>';
  }).join('');
}

/* кнопка «Наверх»: появляется после 400 px, в читалке скрыта */
function updateBackToTop() {
  var b = $('#backToTopBtn'); if (!b) return;
  b.classList.toggle('show', window.scrollY > 400 && !$('#reader'));
}

/* скролл: прогресс чтения и прячущееся меню на телефоне */
var lastY = window.scrollY, ticking = false;
window.addEventListener('scroll', function () {
  if (ticking) return; ticking = true;
  window.requestAnimationFrame(function () {
    var y = window.scrollY, nav = $('.nav');
    if (nav) {
      var heroEl = $('.hero'), limit = heroEl ? heroEl.offsetHeight : 80;
      if (window.innerWidth > 768 || y < limit) nav.classList.remove('hide');
      else if (y - lastY > 10) nav.classList.add('hide');
      else if (lastY - y > 10) nav.classList.remove('hide');
    }
    lastY = y;
    updateBackToTop();
    if (R && $('#rart') && R.blocks.length) {
      var el = document.documentElement, pct = updateProgressBar();
      Store.setProgress(R.work.slug, { percent: pct, scrollTop: el.scrollTop, date: new Date().toISOString() });
    }
    ticking = false;
  });
}, { passive: true });
