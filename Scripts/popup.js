class Popup {
  constructor({ title, message, confirmText = 'OK', cancelText = null, onConfirm = null, useBlur = false }) {
    this.title = title;
    this.message = message;
    this.confirmText = confirmText;
    this.cancelText = cancelText;
    this.onConfirm = onConfirm;
    this.useBlur = useBlur;
    this.overlay = null;
  }

  // Create the elements
  _createMarkup() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'popup-overlay';
    
    this.overlay.innerHTML = `
      <div class="popup-card">
        <div class="popup-header">${this.title}</div>
        <div class="popup-body">${this.message}</div>
        <div class="popup-actions">
          ${this.cancelText ? `<button class="popup-btn btn-secondary" id="popup-cancel">${this.cancelText}</button>` : ''}
          <button class="popup-btn btn-primary" id="popup-confirm">${this.confirmText}</button>
        </div>
      </div>
    `;

    this._attachEvents();
  }

  _attachEvents() {
    const confirmBtn = this.overlay.querySelector('#popup-confirm');
    const cancelBtn = this.overlay.querySelector('#popup-cancel');

    confirmBtn.addEventListener('click', () => {
      if (this.onConfirm) this.onConfirm();
      this.hide();
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hide());
    }

    // Close on clicking outside the card
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });
  }

  show() {
    this._createMarkup();
    document.body.appendChild(this.overlay);

    // Apply blur if enabled (Targeting a generic 'main' tag or body children)
    if (this.useBlur) {
      // You can replace 'main' with your specific content wrapper ID
      document.querySelector('main')?.classList.add('content-blur-active');
    }

    // Trigger animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('active');
    });
  }

  hide() {
    this.overlay.classList.remove('active');
    
    if (this.useBlur) {
      document.querySelector('main')?.classList.remove('content-blur-active');
    }

    // Remove from DOM after transition finishes
    this.overlay.addEventListener('transitionend', () => {
      this.overlay.remove();
    }, { once: true });
  }
}