// In-app confirm dialog (native confirm() would block the timer loop).

export function confirmDialog({ title, text = '', okText = 'OK', cancelText = 'Zrušit' }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2></h2>
        <p></p>
        <div class="dialog-actions">
          <button class="btn" data-r="0"></button>
          <button class="btn btn-danger" data-r="1"></button>
        </div>
      </div>`;
    backdrop.querySelector('h2').textContent = title;
    backdrop.querySelector('p').textContent = text;
    backdrop.querySelector('[data-r="0"]').textContent = cancelText;
    backdrop.querySelector('[data-r="1"]').textContent = okText;
    backdrop.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-r]');
      if (!btn && e.target !== backdrop) return;
      e.stopPropagation();
      backdrop.remove();
      resolve(btn?.dataset.r === '1');
    });
    document.body.append(backdrop);
    backdrop.querySelector('[data-r="0"]').focus();
  });
}
