/* КАРТОЧКИ текстов (как в версии 3) и сетка карточек. */

function cardHtml(w) {
  var fav = Store.isFav(w.slug), href = '#/read/' + w.slug;
  var label = fav ? 'Убрать с полки' : 'Добавить на полку';
  return '<article class="card" data-href="' + href + '" tabindex="0" aria-label="Читать: ' + esc(w.title) + '">' +
    '<div class="card-image-wrapper">' +
      '<img class="card-image" src="' + esc(w.cover) + '" alt="" loading="lazy" decoding="async" onerror="coverFail(this)">' +
      '<div class="card-image-fallback" style="display:none"><span>' + esc(w.genre) + '</span></div>' +
      '<div class="card-badges"><span class="card-year-badge">' + esc(w.year) + '</span>' +
        '<button type="button" class="card-favorite-badge' + (fav ? ' active' : '') + '" data-fav="' + w.slug + '" aria-pressed="' + fav + '" aria-label="' + label + '" title="' + label + '">' + icon('star') + '</button></div>' +
    '</div>' +
    '<div class="card-content">' +
      '<div class="card-genre">' + esc(w.genre) + '</div>' +
      '<h3>' + esc(w.shortTitle) + '</h3>' +
      '<div class="card-desc">' + esc(w.description) + '</div>' +
      '<div class="card-footer"><span class="age-rating">' + esc(w.age) + '</span>' +
        '<div class="card-footer-actions"><button type="button" class="btn-desc" data-desc>Описание</button>' +
        '<a class="btn-read" href="' + href + '">Читать</a></div></div>' +
    '</div></article>';
}
function coverFail(img) {
  img.style.display = 'none';
  if (img.nextElementSibling) img.nextElementSibling.style.display = 'flex';
}
function gridHtml(items) {
  if (!items.length) return '<p class="empty">Пока пусто — нажмите на звезду на карточке, чтобы добавить рассказ или статью.</p>';
  return '<div class="grid">' + items.map(cardHtml).join('') + '</div>';
}

/* на телефонах карточка «оживает», когда почти целиком видна на экране */
var cardObserver = null;
function initCardAnimation() {
  if (cardObserver) { cardObserver.disconnect(); cardObserver = null; }
  if (window.innerWidth > 768 || !('IntersectionObserver' in window)) return;
  cardObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle('card-visible', en.isIntersecting); });
  }, { threshold: 0.75 });
  $$('.card').forEach(function (c) { cardObserver.observe(c); });
}
