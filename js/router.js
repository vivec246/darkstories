/* РОУТЕР: переключение страниц по адресу вида #/books, #/read/slug и обновление мета-тегов. */

var heroTimer = null;

/* точки-переключатели под именем автора: пересобираем по тем слайдам, что реально есть на странице */
function renderHeroDots() {
  var box = $('.hero-dots'); if (!box) return;
  var slides = $$('.hero .slide');
  box.hidden = slides.length < 2;
  box.innerHTML = slides.map(function (s, i) {
    var on = s.classList.contains('on');
    return '<button type="button" class="hero-dot' + (on ? ' active' : '') + '" data-slide="' + i + '" role="tab" aria-selected="' + on + '" aria-label="Слайд ' + (i + 1) + '"></button>';
  }).join('');
}
/* показать слайд номер i и закрасить его точку */
function showHeroSlide(i) {
  var slides = $$('.hero .slide');
  if (!slides[i]) return;
  slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
  $$('.hero-dot').forEach(function (d, k) {
    var on = k === i;
    d.classList.toggle('active', on);
    d.setAttribute('aria-selected', on);
  });
}
/* если картинки шапки нет на сервере — убираем слайд, чтобы не было пустого экрана */
function heroImgFail(img) {
  var wasOn = img.classList.contains('on');
  img.remove();
  if (wasOn) { var first = $('.hero .slide'); if (first) first.classList.add('on'); }
  renderHeroDots();
}
function startHero() {
  clearInterval(heroTimer);
  /* листаем всегда; если в системе отключены анимации, картинки просто меняются без плавного перехода (это в CSS) */
  heroTimer = setInterval(function () {
    var slides = $$('.hero .slide');
    if (slides.length < 2) return;
    var cur = -1;
    slides.forEach(function (s, k) { if (s.classList.contains('on')) cur = k; });
    /* берём следующую картинку, которая уже загрузилась; недогруженные пропускаем, чтобы не было пустого экрана */
    for (var step = 1; step <= slides.length; step++) {
      var idx = (cur + step + slides.length) % slides.length;
      if (cur >= 0 && idx === cur) break;
      if (slides[idx].complete === false) continue;
      showHeroSlide(idx);
      return;
    }
  }, 5000);
}
function setMeta(title, desc, image) {
  document.title = title;
  var d = desc || SITE.description;
  $('#metaDescription').setAttribute('content', d);
  $('#ogTitle').setAttribute('content', title); $('#twitterTitle').setAttribute('content', title);
  $('#ogDescription').setAttribute('content', d); $('#twitterDescription').setAttribute('content', d);
  var img = image || 'cap/header_1.jpg';
  $('#ogImage').setAttribute('content', img); $('#twitterImage').setAttribute('content', img);
}
function parseHash() {
  var h = location.hash.replace(/^#/, '');
  if (h.charAt(0) !== '/') h = '/' + h;
  var parts = h.split('?'), path = parts[0].replace(/\/+$/, '') || '/';
  return { path: path, params: new URLSearchParams(parts[1] || '') };
}
/* мгновенный переход по прокрутке (работает и в старых браузерах, где нет behavior:'instant') */
function jumpTo(y) {
  var el = document.documentElement, prev = el.style.scrollBehavior;
  el.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  el.style.scrollBehavior = prev;
}
function updateTabs(path) {
  $$('.tab').forEach(function (a) {
    var on = a.getAttribute('href') === '#' + path;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
var savedScroll = null;   /* где стояли на странице перед открытием читалки */
var returnHash = null;    /* на какую страницу вернуться из читалки */
var lastShellHash = '#/';
function route() {
  setTimeout(function () { if (typeof updateBackToTop === 'function') updateBackToTop(); }, 0);
  var wasReader = !!R, hadShell = !!$('.shell');
  closeDialog(); clearInterval(heroTimer); R = null;
  $('#ldWork').textContent = '';
  var r = parseHash(), path = r.path;
  if (path === '/shelf') { location.replace('#/'); return; }
  if (path.indexOf('/read/') === 0) {
    if (!wasReader && hadShell) { savedScroll = window.scrollY; returnHash = lastShellHash; }
    jumpTo(0);
    if (openReader(path, r.params)) return;
  }
  var page = PAGES[path];
  if (!page) {
    $('#app').innerHTML = shell(path, notFoundHtml(), false);
    setMeta('Страница не найдена — ' + SITE.name);
    jumpTo(0);
    return;
  }
  lastShellHash = location.hash || '#/';
  var showHero = !!page.hero;
  /* переход между вкладками: шапка и меню остаются, меняется только содержимое, прокрутка не трогается */
  if (hadShell && !wasReader && !!$('.hero') === showHero) {
    $('#main').innerHTML = page.render();
    updateTabs(path);
    var q = $('#q'); if (q && q.value) { q.value = ''; runSearch(''); }
    setMeta(page.title, page.desc);
    if (showHero) startHero();
    initCardAnimation();
    return;
  }
  var hadHero = !!$('.hero');
  $('#app').innerHTML = shell(path, page.render(), showHero);
  setMeta(page.title, page.desc);
  if (showHero) startHero();
  if (wasReader && savedScroll !== null) jumpTo(savedScroll);
  else if (hadShell && !wasReader && showHero && !hadHero) { var nv = $('#nav'); jumpTo(nv ? nv.offsetTop : 0); }
  else jumpTo(0);
  if (wasReader) savedScroll = null;
  initCardAnimation();
}
