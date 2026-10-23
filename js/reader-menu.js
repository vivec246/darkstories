/* МЕНЮ ПРАВОЙ КНОПКИ В ЧИТАЛКЕ и ЦИТАТЫ (как в версии 3):
   «Копировать», «Процитировать», «Выделить всё». Цитату можно отправить ВКонтакте, в Telegram или скопировать. */

var capturedSelectionText = '';
var pendingQuoteShareText = '';

function hideContextMenu() { var m = $('#readerContextMenu'); if (m) m.classList.remove('show'); }
function contextMenuOpen() { var m = $('#readerContextMenu'); return !!(m && m.classList.contains('show')); }
function showContextMenu(x, y) {
  var m = $('#readerContextMenu'); if (!m) return;
  var has = capturedSelectionText.length > 0;
  $$('[data-action="copy"], [data-action="quote"]', m).forEach(function (i) { i.style.display = has ? 'flex' : 'none'; });
  m.classList.add('show');
  var r = m.getBoundingClientRect();
  m.style.left = Math.max(10, Math.min(x, window.innerWidth - r.width - 10)) + 'px';
  m.style.top = Math.max(10, Math.min(y, window.innerHeight - r.height - 10)) + 'px';
}

document.addEventListener('contextmenu', function (e) {
  if (!R || !e.target.closest || !e.target.closest('#reader') || e.target.closest('.v3modal')) return;
  e.preventDefault();
  /* выделение запоминаем сразу: после клика по меню браузер его снимет */
  capturedSelectionText = String(window.getSelection() || '').trim();
  showContextMenu(e.clientX, e.clientY);
});
document.addEventListener('click', function (e) {
  var m = $('#readerContextMenu');
  if (m && m.classList.contains('show') && !m.contains(e.target)) hideContextMenu();
});
window.addEventListener('scroll', hideContextMenu, { passive: true });
window.addEventListener('resize', hideContextMenu);

(function () {
  var m = $('#readerContextMenu'); if (!m) return;
  m.addEventListener('click', function (e) {
    var item = e.target.closest('.context-menu-item'); if (!item) return;
    var action = item.getAttribute('data-action');
    hideContextMenu();
    if (action === 'copy') copySelection();
    else if (action === 'selectAll') selectAllReaderText();
    else if (action === 'quote') quoteSelection();
  });
})();

function copySelection() {
  if (!capturedSelectionText) return;
  copyText(capturedSelectionText).then(function () { toast('Текст скопирован'); }).catch(function () { toast('Не удалось скопировать текст'); });
}
function selectAllReaderText() {
  var body = $('#rart'); if (!body) return;
  var range = document.createRange(); range.selectNodeContents(body);
  var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
}
function quoteSelection() {
  if (!capturedSelectionText || !R) return;
  var w = R.work, fullText = '«' + capturedSelectionText + '»\n— «' + w.title + '», ' + SITE.name;
  var shareUrl = location.origin + location.pathname + '#/read/' + w.slug;
  /* на телефоне — сразу системное «Поделиться» */
  if (navigator.share) { navigator.share({ text: fullText, url: shareUrl }).catch(function () {}); return; }
  openQuoteShareModal(capturedSelectionText, fullText, shareUrl);
}
function openQuoteShareModal(quoteOnly, fullText, shareUrl) {
  pendingQuoteShareText = fullText;
  var pv = $('#quoteSharePreview'); if (pv) pv.textContent = '«' + quoteOnly + '»';
  var vk = $('#quoteShareVk'); if (vk) vk.href = 'https://vk.com/share.php?url=' + encodeURIComponent(shareUrl) + '&title=' + encodeURIComponent(fullText);
  var tg = $('#quoteShareTelegram'); if (tg) tg.href = 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(fullText);
  var modal = $('#quoteShareModal'); if (modal) modal.style.display = 'flex';
}
function closeQuoteShare() { var m = $('#quoteShareModal'); if (m) m.style.display = 'none'; }
function quoteShareOpen() { var m = $('#quoteShareModal'); return !!(m && m.style.display === 'flex'); }
function copyQuoteToClipboard() {
  if (!pendingQuoteShareText) return;
  copyText(pendingQuoteShareText).then(function () { toast('Цитата скопирована'); closeQuoteShare(); })
    .catch(function () { toast('Не удалось скопировать цитату'); });
}
