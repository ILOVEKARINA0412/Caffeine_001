import { cleanCart, totals } from './shop-state.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = 'caffeine-shop-v1';
let products = [], cart = {}, currency = 'SGD', category = 'All', selected = null;
let bagSaved = false;
const isProductPage = !!$('#product-page-detail');
const money = cents => `${currency} ${new Intl.NumberFormat('en', {minimumFractionDigits:2, maximumFractionDigits:2}).format(cents / 100)}`;
function save() {
  try { localStorage.setItem(key, JSON.stringify({cart, currency})); bagSaved = true; } catch { bagSaved = false; }
}
const bag = document.createElement('button');
bag.type = 'button'; bag.className = 'shop-bag';
bag.setAttribute('aria-haspopup', 'dialog'); bag.setAttribute('aria-controls', 'cart-dialog');
$('header.nav').append(bag);
function update() {
  const sum = totals(cart, products, currency);
  bag.innerHTML = `<svg width="22" height="24" viewBox="0 0 24 26" fill="none" aria-hidden="true"><path d="M3 7h18l1 17H2L3 7Z M8 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.5"/></svg><span>${sum.count}</span>`;
  bag.setAttribute('aria-label', `Open shopping bag, ${sum.count} items`);
  save(); renderGrid(); renderCart();
}
function add(id, quantity = 1) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const previous = cart[id] || 0;
  cart[id] = Math.min(99, previous + quantity);
  const added = cart[id] - previous;
  update();
  if (added === 0) {
    const feedback = $('#product-dialog').open || isProductPage ? $('#product-feedback') : $('#shop-feedback');
    feedback.hidden = false;
    feedback.textContent = 'Your bag already has the maximum of 99 of this item';
    return;
  }
  if (isProductPage) {
    if (!bagSaved) {
      $('#product-feedback').textContent = 'Added to your bag for this visit Open View bag to see it; your browser is not allowing the bag to be saved between pages';
      return;
    }
    try { sessionStorage.setItem('caffeine-added-to-bag', JSON.stringify({id, quantity:added})); } catch { /* The saved bag still follows you to Shop. */ }
    location.assign('shop.html');
    return;
  }
  if ($('#product-dialog').open) $('#product-dialog').close();
  showAdded(product, added);
}
function showAdded(product, quantity) {
  const feedback = $('#shop-feedback');
  feedback.hidden = false;
  feedback.innerHTML = `<span><strong>Added to your bag</strong> ${quantity} × ${escape(product.name)}</span><button type="button" class="shop-primary" id="added-view-bag">View bag</button>`;
  feedback.focus({preventScroll:true});
  window.scrollTo({top:0, behavior:'instant'});
}
function renderGrid() {
  if (!$('#shop-grid')) return;
  const term = $('#shop-search').value.trim().toLowerCase();
  const items = products.filter(p => (category === 'All' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(term));
  const sort = $('#shop-sort').value;
  if (sort !== 'featured') items.sort((a,b) => (a.prices[currency] - b.prices[currency]) * (sort === 'low' ? 1 : -1));
  $('#shop-results').textContent = `${items.length} ${items.length === 1 ? 'favourite' : 'favourites'} to explore`;
  $('#shop-grid').innerHTML = items.length ? items.map(p => `<article class="shop-product" data-kind="${p.category === 'Coffee' ? 'coffee' : p.category === 'Tea & more' ? 'tea' : 'bites'}"><button class="shop-product-open" type="button" data-product="${p.id}" aria-label="View ${escape(p.name)}"><div class="shop-photo"><img src="${p.image}" alt="${escape(p.name)}" loading="lazy" width="800" height="600"${p.id === 'matcha-latte' ? ' class="shop-photo-contain"' : ''}><span>Take a closer look ↗</span></div><div class="shop-product-title"><h2>${escape(p.name)}</h2><span>${money(p.prices[currency])}</span></div></button><p>${escape(p.category)}</p><button type="button" class="shop-add" data-add="${p.id}">Add to bag <span aria-hidden="true">+</span></button></article>`).join('') : '<p class="shop-empty">No matches yet Try another search or category</p>';
}
function renderCart() {
  const items = products.filter(p => cart[p.id]);
  const sum = totals(cart, products, currency);
  $('#cart-content').innerHTML = items.length ? `<p class="shop-demo-label">Sample pricing · ${currency}</p><ul class="cart-items">${items.map(p => `<li><img src="${p.image}" alt="" width="96" height="72"><div><h3><a href="product.html?id=${p.id}">${escape(p.name)}</a></h3><p>${money(p.prices[currency])} each</p><div class="cart-quantity"><button type="button" data-change="${p.id}" data-step="-1" aria-label="Decrease ${escape(p.name)} quantity">−</button><span aria-label="Quantity">${cart[p.id]}</span><button type="button" data-change="${p.id}" data-step="1" aria-label="Increase ${escape(p.name)} quantity" ${cart[p.id] >= 99 ? 'disabled' : ''}>+</button><button type="button" class="cart-remove" data-remove="${p.id}">Remove<span class="visually-hidden"> ${escape(p.name)}</span></button></div></div><strong>${money(p.prices[currency] * cart[p.id])}</strong></li>`).join('')}</ul><div class="cart-subtotal"><span>Sample subtotal</span><strong>${money(sum.cents)}</strong></div><p>No payment or order will be submitted</p><button type="button" class="shop-primary" id="checkout-open">Preview checkout</button>` : '<div class="shop-empty"><p>Your bag is waiting for a little Caffeine</p><button type="button" class="shop-primary" data-close>Continue shopping</button></div>';
}
function productContent(p) {
  const heading = isProductPage ? 'h1' : 'h2';
  return `<div class="product-layout"><div class="product-gallery"><button type="button" class="product-zoom" id="photo-zoom" aria-label="Enlarge photograph of ${escape(p.name)}" aria-haspopup="dialog" aria-controls="photo-dialog"><img class="shop-detail-photo${p.id === 'matcha-latte' ? ' shop-photo-contain' : ''}" src="${p.image}" alt="${escape(p.name)}" width="800" height="600"><span>Enlarge image <span aria-hidden="true">↗</span></span></button></div><div class="product-info"><p class="shop-eyebrow">${escape(p.category)}</p><${heading}>${escape(p.name)}</${heading}><p>${escape(p.description)}</p><p class="shop-detail-price"><span id="product-current-price">${money(p.prices[currency])}</span> <small>sample price</small></p><form id="product-form"><label for="product-quantity">Quantity</label><div class="product-quantity"><button type="button" data-quantity-step="-1" aria-label="Decrease quantity">−</button><input id="product-quantity" name="quantity" type="number" value="1" min="1" max="99" required><button type="button" data-quantity-step="1" aria-label="Increase quantity">+</button></div><button type="submit" class="shop-primary">Add to bag</button></form><p id="product-feedback" role="status"></p><div class="product-links"><button type="button" class="shop-text-button" id="product-view-bag">View bag</button><button type="button" class="shop-text-button" id="product-share">Copy product link</button>${isProductPage ? '' : `<a class="shop-text-button" href="product.html?id=${p.id}">View full details ↗</a>`}</div><p id="product-share-status" role="status"></p><details class="product-accordion" open><summary>On the menu</summary><dl class="product-specs"><div><dt>Category</dt><dd>${escape(p.category)}</dd></div><div><dt>Menu notes</dt><dd>${escape(p.description)}</dd></div></dl></details><details class="product-accordion"><summary>Before you order</summary><p>Ask us about ingredients allergens and dietary requirements before ordering Final recipes and availability will be confirmed by the café</p><p>This shop uses sample prices Adding items to your bag does not place an order or reserve a product</p></details><details class="product-accordion"><summary>Visit Caffeine</summary><p>Mon-Sat: 8:00am–8:00pm</p><a href="index.html#visit">Plan your visit ↗</a></details></div></div>`;
}
function renderRelated(p) {
  if (!isProductPage) return;
  const food = p.category === 'Little bites';
  const matches = products.filter(item => item.id !== p.id && (food ? item.category !== 'Little bites' : item.category === 'Little bites')).slice(0,3);
  $('#product-related').innerHTML = `<div class="product-related-heading"><h2 id="related-title">${food ? 'A cup to go with it' : 'Something for the table'}</h2><a href="shop.html">Explore all ↗</a></div><div class="shop-grid">${matches.map(item => `<article class="shop-product"><a class="product-related-link" href="product.html?id=${item.id}"><div class="shop-photo"><img src="${item.image}" alt="${escape(item.name)}" loading="lazy" width="800" height="600"></div><div class="shop-product-title"><h3>${escape(item.name)}</h3><span>${money(item.prices[currency])}</span></div></a><button type="button" class="shop-add" data-add="${item.id}">Add to bag <span aria-hidden="true">+</span></button></article>`).join('')}</div>`;
}
function showProduct(id) {
  selected = products.find(p => p.id === id);
  if (!selected) return;
  const p = selected;
  (isProductPage ? $('#product-page-detail') : $('#product-detail')).innerHTML = productContent(p);
  if (isProductPage) {
    document.title = `${p.name} | Caffeine`;
    $('#product-breadcrumb-name').textContent = p.name;
    document.querySelector('meta[name="description"]').content = `${p.name} ${p.description} Explore Caffeine's menu`;
    renderRelated(p);
  } else $('#product-dialog').showModal();
}
bag.addEventListener('click', () => { renderCart(); $('#cart-dialog').showModal(); });
document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-close')) button.closest('dialog').close();
  if (button.dataset.product) showProduct(button.dataset.product);
  if (button.dataset.add) add(button.dataset.add);
  if (button.id === 'added-view-bag') { renderCart(); $('#cart-dialog').showModal(); }
  if (button.hasAttribute('data-quantity-step')) {
    const input = $('#product-quantity');
    const value = Number(input.value);
    input.value = Math.min(99, Math.max(1, (Number.isInteger(value) ? value : 1) + Number(button.dataset.quantityStep)));
    input.dispatchEvent(new Event('change', {bubbles:true}));
  }
  if (button.id === 'photo-zoom') {
    $('#photo-detail').innerHTML = `<img src="${selected.image}" alt="${escape(selected.name)}" width="800" height="600"${selected.id === 'matcha-latte' ? ' style="object-fit:contain;background:#fff"' : ''}><p>${escape(selected.name)}</p>`;
    $('#photo-dialog').showModal();
  }
  if (button.id === 'product-share') {
    const url = new URL(`product.html?id=${selected.id}`, location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      $('#product-share-status').textContent = 'Product link copied';
    } catch {
      $('#product-share-status').innerHTML = `<label>Copy this product link<input class="product-share-fallback" type="text" readonly value="${escape(url)}"></label>`;
      $('#product-share-status input').select();
    }
  }
  if (button.hasAttribute('data-category')) {
    category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    renderGrid();
  }
  if (button.dataset.change) {
    const id = button.dataset.change;
    const next = Math.max(0, Math.min(99, (cart[id] || 0) + Number(button.dataset.step)));
    if (next) cart[id] = next; else delete cart[id];
    update();
    const same = [...document.querySelectorAll('[data-change]')].find(b => b.dataset.change === id && b.dataset.step === button.dataset.step);
    (same || $('#cart-dialog [data-close]')).focus();
  }
  if (button.dataset.remove) { delete cart[button.dataset.remove]; update(); $('#cart-dialog [data-close]').focus(); }
  if (button.id === 'product-view-bag') { if ($('#product-dialog').open) $('#product-dialog').close(); $('#cart-dialog').showModal(); }
  if (button.id === 'checkout-open') {
    $('#cart-dialog').close();
    $('#checkout-summary').innerHTML = `<ul class="checkout-items">${products.filter(p => cart[p.id]).map(p => `<li><span>${escape(p.name)} × ${cart[p.id]}</span><strong>${money(p.prices[currency] * cart[p.id])}</strong></li>`).join('')}</ul><div class="cart-subtotal"><span>Sample subtotal</span><strong>${money(totals(cart, products, currency).cents)}</strong></div>`;
    $('#checkout-dialog').showModal();
  }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'product-form') return;
  event.preventDefault();
  const quantity = Number($('#product-quantity').value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
  add(selected.id, quantity);
});
$('#shop-currency').addEventListener('change', event => {
  currency = event.target.value; update();
  if (selected && $('#product-current-price')) $('#product-current-price').textContent = money(selected.prices[currency]);
  if (isProductPage && selected) renderRelated(selected);
});
$('#shop-search')?.addEventListener('input', renderGrid);
$('#shop-sort')?.addEventListener('change', renderGrid);
document.querySelectorAll('.shop-dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.id === 'photo-dialog') { $('#photo-zoom')?.focus({preventScroll:true}); return; }
    const target = dialog.id === 'product-dialog' ? document.querySelector(`[data-product="${selected?.id}"]`) : bag;
    if (!document.querySelector('.shop-dialog[open]')) target?.focus({preventScroll:true});
    document.documentElement.classList.toggle('shop-dialog-open', !!document.querySelector('.shop-dialog[open]'));
  });
  new MutationObserver(() => document.documentElement.classList.toggle('shop-dialog-open', !!document.querySelector('.shop-dialog[open]'))).observe(dialog, {attributes:true, attributeFilter:['open']});
});
async function init() {
  try {
    const response = await fetch('shop-products.json');
    if (!response.ok) throw new Error('Products unavailable');
    products = await response.json();
    try { const stored = JSON.parse(localStorage.getItem(key)); cart = cleanCart(stored?.cart, products); if (['SGD','HKD'].includes(stored?.currency)) currency = stored.currency; } catch { cart = {}; }
    $('#shop-currency').value = currency; update();
    if (!isProductPage) {
      try {
        const notice = JSON.parse(sessionStorage.getItem('caffeine-added-to-bag'));
        sessionStorage.removeItem('caffeine-added-to-bag');
        const product = products.find(p => p.id === notice?.id);
        if (product && Number.isInteger(notice.quantity) && notice.quantity > 0 && notice.quantity <= (cart[product.id] || 0)) showAdded(product, notice.quantity);
      } catch { /* A notice is optional; the bag itself remains available. */ }
    }
    if (isProductPage) {
      const id = new URLSearchParams(location.search).get('id');
      if (products.some(p => p.id === id)) showProduct(id);
      else {
        document.title = 'Product not found | Caffeine';
        $('#product-page-detail').innerHTML = '<h1>Product not found</h1><p>Explore our coffee tea and little bites</p><a class="shop-primary" href="shop.html">Back to Shop</a>';
      }
    }
  } catch {
    $('#shop-results').innerHTML = 'The shop could not load Please refresh or <a href="coffee.html">explore the menu</a>.';
    bag.disabled = true;
  }
}
init();
