/* ЧИТАЛКА (как в версии 3): страница текста, прогресс, закладки, оглавление, размер шрифта, тема.
   Кнопки управления — из версии 4. Меню правой кнопки и цитаты — в reader-menu.js. */

var R = null; // состояние открытой читалки
var controlsOn = true;

var SPINNER = '<svg class="ico spin" viewBox="0 0 24 24" style="width:2em;height:2em" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>';
var TRASH = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

function readerShell(w, night) {
  return '<div class="reader ' + (night ? 'night' : 'day') + '" id="reader">' +
    '<div class="rbar" aria-hidden="true"><i id="rbar"></i></div>' +
    '<div class="rtools" id="rtools">' +
    '<button type="button" class="btn control" data-act="close" aria-label="Закрыть читалку">' + icon('back') + '</button>' +
    '<button type="button" class="btn control" data-act="theme" aria-label="Тема">' + icon('moon') + '</button>' +
    '<button type="button" class="btn control" data-act="bookmarks" aria-label="Закладки">' + icon('bookmark') + '</button>' +
    '<div class="fontwrap"><div class="fontpop" id="fontpop" hidden><input type="range" id="fontrange" min="0.8" max="2.0" step="0.1" value="' + Store.s.fontSize + '" aria-label="Размер шрифта"></div>' +
    '<button type="button" class="btn control" data-act="font" aria-label="Размер шрифта">' + icon('type') + '</button></div>' +
    '<button type="button" class="btn control" data-act="toc" aria-label="Содержание">' + icon('list') + '</button></div>' +
    '<button type="button" class="btn control share" id="rshare" data-act="share" aria-label="Поделиться">' + icon('share') + '</button>' +
    '<div class="rcontent" id="rcontent"><div id="rart"><div class="loadmsg">' + SPINNER + '<p>ЗАГРУЗКА</p></div></div></div></div>';
}
function applyFont() {
  $$('#rart p').forEach(function (p) { p.style.fontSize = Store.s.fontSize + 'em'; });
}
function toggleControls() {
  controlsOn = !controlsOn;
  var a = $('#rtools'), b = $('#rshare');
  if (a) a.classList.toggle('off', !controlsOn);
  if (b) b.classList.toggle('off', !controlsOn);
}
function fillReader(w, text, params) {
  var q = params.get('q') || '', blocks = parseMd(text), saved = Store.s.progress[w.slug], token = R;
  R.blocks = blocks;
  $('#rart').innerHTML = mdHtml(w.title, blocks, q);
  $$('#rart h2, #rart h3').forEach(function (h) { if (!h.id) h.id = slugify(h.textContent); });
  applyFont();
  if (q) {
    var mk = $('mark', $('#rart'));
    if (mk) setTimeout(function () { mk.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
  } else if (saved && saved.scrollTop > 100) {
    /* как в версии 3: сразу возвращаем на место, где остановились */
    setTimeout(function () { if (R === token) { window.scrollTo(0, saved.scrollTop); updateProgressBar(); } }, 300);
  }
  updateProgressBar();
}
function updateProgressBar() {
  var el = document.documentElement, max = el.scrollHeight - el.clientHeight;
  var pct = max > 0 ? Math.round(el.scrollTop / max * 100) : 0;
  var bar = $('#rbar'); if (bar) bar.style.width = pct + '%';
  return pct;
}

/* окна: «Содержание» и «Закладки» (оформление из версии 3) */
function modalHtml(inner) {
  return '<div class="v3modal" data-bgclose><div class="modal-box">' + inner +
    '<button type="button" class="modal-x" data-close aria-label="Закрыть">✕</button></div></div>';
}
function openDialog(kind) {
  if (!R) return;
  var w = R.work, body = '';
  if (kind === 'toc') {
    var hs = R.blocks.filter(function (b) { return b.t === 'h2' || b.t === 'h3'; });
    body = '<h4 class="modal-title center">Содержание</h4>' + (hs.length
      ? '<div class="toc-list">' + hs.map(function (b) {
          return '<button type="button" data-goto-id="' + esc(b.id) + '" data-close' + (b.t === 'h3' ? ' style="margin-left:18px;width:calc(100% - 18px)"' : '') + '>' + esc(b.text) + '</button>';
        }).join('') + '</div>'
      : '<p class="modal-empty">Нет заголовков</p>');
  } else {
    var list = Store.s.bookmarks[w.slug] || [];
    body = '<h3 class="modal-title">ЗАКЛАДКИ</h3><div id="bookmarksList">' + (list.length
      ? list.map(function (b) {
          return '<div class="bookmark-item" data-bm-go="' + b.pos + '"><div><strong>' + esc(b.text) + '</strong><br><span>' + esc(b.time) + '</span></div>' +
            '<div class="delete-bm" data-bm-del="' + b.id + '" role="button" aria-label="Удалить закладку">' + TRASH + '</div></div>';
        }).join('')
      : '<p class="modal-empty">Нет закладок</p>') +
      '</div><div class="modal-actions"><button type="button" class="btn outline" data-act="bm-save">+ Сохранить позицию</button></div>';
  }
  R.dialog = kind;
  $('#overlay-root').innerHTML = modalHtml(body);
}
function closeDialog() { $('#overlay-root').innerHTML = ''; if (R) R.dialog = null; }

function openReader(path, params) {
  var slug = path.slice('/read/'.length), w = getWork(slug);
  if (!w) return false;
  R = { work: w, blocks: [], dialog: null };
  controlsOn = true;
  Store.addRecent(w.slug);
  $('#app').innerHTML = readerShell(w, Store.s.readerNight);
  setMeta(w.title + ' — ' + SITE.name, w.description, w.cover);
  $('#ldWork').textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': w.kind === 'article' ? 'Article' : 'Book', name: w.title, headline: w.title, description: w.description, datePublished: w.year + '-01-01', inLanguage: 'ru', image: w.cover, author: { '@type': 'Person', name: SITE.author }, isAccessibleForFree: true });
  var token = R;
  fetchText(w.path).then(function (text) { if (R === token) fillReader(w, text, params); })
    .catch(function () {
      if (R !== token) return;
      var file = location.protocol === 'file:';
      $('#rart').innerHTML = '<div class="loadmsg"><p>Не удалось загрузить текст</p>' +
        (file ? '<p class="small">Сайт нужно открывать через веб-сервер (GitHub Pages или <code>python -m http.server</code>) — из папки напрямую браузер не даёт читать файлы.</p>' : '') +
        '<button type="button" class="btn" data-act="close" style="margin-top:1.25rem">Закрыть</button></div>';
    });
  return true;
}
