(() => {
  const section = document.querySelector('#menu');
  if (!section) return;
  const decks = [];
  const dialog = document.createElement('dialog');
  dialog.className = 'card-dialog';
  dialog.setAttribute('aria-label', 'Enlarged menu card');
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'card-dialog-close'; close.textContent = 'Close';
  const preview = document.createElement('div');
  preview.className = 'card-preview';
  dialog.append(close, preview); document.body.append(dialog);
  let returnFocus = null;
  function openCard(card, button) {
    const copy = card.cloneNode(true);
    copy.querySelectorAll('.card-select').forEach(control => control.remove());
    copy.removeAttribute('aria-hidden'); copy.removeAttribute('inert');
    copy.removeAttribute('data-position');
    copy.style.setProperty('--card-tint', getComputedStyle(card).getPropertyValue('--card-tint'));
    preview.replaceChildren(copy);
    returnFocus = button;
    dialog.showModal(); document.documentElement.classList.add('card-dialog-open');
    close.focus();
  }
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('card-dialog-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  document.querySelectorAll('.menu-panel').forEach((panel) => {
    const cards = Array.from(panel.querySelectorAll(':scope > .menu-card'));
    if (cards.length < 2) return;
    let selected = 0;
    const stage = document.createElement('div');
    stage.className = 'deck-stage';
    stage.tabIndex = 0;
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', 'Menu cards Use left and right arrow keys to browse');
    const controls = document.createElement('div');
    controls.className = 'deck-controls';
    const prev = document.createElement('button');
    prev.type = 'button'; prev.textContent = 'Previous';
    const next = document.createElement('button');
    next.type = 'button'; next.textContent = 'Next';
    const status = document.createElement('output');
    status.className = 'deck-status'; status.setAttribute('aria-live', 'polite');
    controls.append(prev, status, next);
    const hint = document.createElement('p');
    hint.className = 'deck-hint'; hint.textContent = 'Swipe to explore Tap the front card to enlarge';
    cards.forEach((card, i) => {
      const pick = document.createElement('button');
      pick.type = 'button'; pick.className = 'card-select';
      pick.setAttribute('aria-label', 'View ' + card.querySelector('h3').textContent);
      pick.addEventListener('click', () => {
        if (i === selected) openCard(card, pick);
        else { select(i); stage.focus({ preventScroll: true }); }
      });
      card.append(pick); stage.append(card);
    });
    panel.append(stage, controls, hint);
    panel.classList.add('menu-deck');
    function select(index) {
      selected = (index + cards.length) % cards.length;
      cards.forEach((card, i) => {
        const position = i === selected ? 'active' : i === (selected + 1) % cards.length ? 'next' : i === (selected - 1 + cards.length) % cards.length ? 'previous' : 'away';
        card.dataset.position = position;
        card.inert = position === 'away';
        card.setAttribute('aria-hidden', String(position === 'away'));
        const button = card.querySelector('.card-select');
        button.hidden = position === 'away';
        button.setAttribute('aria-label', (position === 'active' ? 'Enlarge ' : 'View ') + card.querySelector('h3').textContent);
        button.setAttribute('aria-haspopup', 'dialog');
      });
      status.textContent = `${selected + 1} / ${cards.length}`;
      status.setAttribute('aria-label', `${cards[selected].querySelector('h3').textContent}, ${selected + 1} of ${cards.length}`);
      if (document.querySelector(`.menu-choice input[value="${panel.dataset.menu}"]`).checked) {
        section.style.setProperty('--deck-wash', getComputedStyle(cards[selected]).getPropertyValue('--card-tint'));
      }
    }
    prev.addEventListener('click', () => select(selected - 1));
    next.addEventListener('click', () => select(selected + 1));
    stage.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault(); select(selected + (event.key === 'ArrowRight' ? 1 : -1)); stage.focus({ preventScroll: true });
    });
    let start = null, suppressClickUntil = 0;
    stage.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.pointerType === 'mouse') return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });
    stage.addEventListener('pointerup', (event) => {
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        select(selected + (dx < 0 ? 1 : -1)); suppressClickUntil = Date.now() + 400;
      }
    });
    stage.addEventListener('pointercancel', () => { start = null; });
    stage.addEventListener('click', (event) => {
      if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    decks.push(() => select(selected));
    select(0);
  });
  section.classList.add('has-decks');
  section.querySelectorAll('input[name="menu"]').forEach(input => input.addEventListener('change', () => decks.forEach(refresh => refresh())));
})();
