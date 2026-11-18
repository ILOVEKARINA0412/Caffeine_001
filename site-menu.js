(() => {
  const header = document.querySelector('header.nav');
  const navigation = header?.querySelector('nav');
  const toggle = header?.querySelector('.menu-toggle');
  if (!header || !navigation || !toggle || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'site-menu'; dialog.id = 'site-menu';
  dialog.setAttribute('aria-label', 'Main navigation');
  const top = document.createElement('div'); top.className = 'menu-topbar';
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'menu-close'; close.setAttribute('aria-label', 'Close menu');
  close.innerHTML = '<span aria-hidden="true"></span>';
  const brand = header.querySelector('.wordmark').cloneNode(true); brand.href = 'index.html';
  top.append(close, brand);
  navigation.className = 'site-menu-links';
  const foot = document.createElement('p'); foot.className = 'site-menu-footer';
  foot.textContent = 'Coffee brings us together';
  dialog.append(top, navigation, foot); document.body.append(dialog);
  header.classList.add('nav--menu'); toggle.hidden = false;
  toggle.setAttribute('aria-controls', dialog.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    dialog.showModal(); toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('site-menu-open'); close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('site-menu-open');
    toggle.focus({ preventScroll: true });
  });
})();
