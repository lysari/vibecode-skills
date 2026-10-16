/* One open at a time. Drop the group attribute for independent rows. */
document.querySelectorAll('[data-liquid-group]').forEach((group) => {
  const rows = [...group.querySelectorAll('.liquid')];

  const setOpen = (row, open) => {
    row.classList.toggle('is-open', open);
    row.querySelector('.liquid-trigger').setAttribute('aria-expanded', String(open));
    /* `inert` keeps a collapsed panel out of the tab order and away from screen
       readers, which `overflow: hidden` alone does not. */
    row.querySelector('.liquid-panel').toggleAttribute('inert', !open);
  };

  const settle = (row, cls) => {
    /* Never clear the other row's in-flight class here. Removing a class that
       carries an animation reverts its value in a single frame, and a
       transition does not catch it — let it end on its own. */
    row.classList.add(cls);
  };

  rows.forEach((row) => {
    const trigger = row.querySelector('.liquid-trigger');

    trigger.addEventListener('click', () => {
      const opening = !row.classList.contains('is-open');
      const previous = rows.find((r) => r !== row && r.classList.contains('is-open'));

      setOpen(row, opening);
      if (opening) settle(row, 'is-settling');

      /* Whichever row is leaving gets the squash — the one clicked shut, or the
         one displaced by this one opening. Both look like a close. */
      const closing = opening ? previous : row;
      if (closing) { setOpen(closing, false); settle(closing, 'is-squashing'); }
    });

    /* animationend bubbles, so each handler checks it is hearing its own
       element's animation. Without this, a child's shorter animation finishing
       first pulls the parent's class out from under it. */
    row.addEventListener('animationend', (e) => {
      if (e.target === row) row.classList.remove('is-settling');
    });
    trigger.addEventListener('animationend', (e) => {
      if (e.target === trigger) row.classList.remove('is-squashing');
    });
  });
});
