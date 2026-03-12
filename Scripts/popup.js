class Popup {
  constructor({ title, message, confirmText = 'OK', cancelText = null, onConfirm = null, useBlur = false, isInput = false, placeholder = '' }) {
    this.title = title;
    this.message = message;
    this.confirmText = confirmText;
    this.cancelText = cancelText;
    this.onConfirm = onConfirm;
    this.useBlur = useBlur;
    this.isInput = isInput; // Toggle for text field
    this.placeholder = placeholder;
    this.overlay = null;
  }

  _createMarkup() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'popup-overlay';
    
    // Create the input HTML if isInput is true
    const inputHTML = this.isInput 
      ? `<input type="text" id="popup-input" class="popup-input" placeholder="${this.placeholder}" autofocus>`
      : '';

    this.overlay.innerHTML = `
      <div class="popup-card">
        <div class="popup-header">${this.title}</div>
        <div class="popup-body">
          <p>${this.message}</p>
          ${inputHTML} 
        </div>
        <div class="popup-actions">
          ${this.cancelText ? `<button class="popup-btn btn-secondary" id="popup-cancel">${this.cancelText}</button>` : ''}
          <button class="popup-btn btn-primary" id="popup-confirm">${this.confirmText}</button>
        </div>
      </div>
    `;
  }

  _attachEvents(resolve) {
    const confirmBtn = this.overlay.querySelector('#popup-confirm');
    const cancelBtn = this.overlay.querySelector('#popup-cancel');
    const inputField = this.overlay.querySelector('#popup-input');

    confirmBtn.addEventListener('click', () => {
      // If it's an input popup, get the value. Otherwise, just return true.
      const result = this.isInput ? inputField.value : true;
      
      if (this.onConfirm) this.onConfirm(result);
      resolve(result); // This sends the text back to your 'await' call
      this.hide();
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        resolve(null);
        this.hide();
      });
    }

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        resolve(null);
        this.hide();
      }
    });
  }

  show() {
    return new Promise((resolve) => {
      this._createMarkup();
      this._attachEvents(resolve);
      document.body.appendChild(this.overlay);

      if (this.useBlur) {
        document.querySelector('main')?.classList.add('content-blur-active');
      }

      requestAnimationFrame(() => {
        this.overlay.classList.add('active');
        // Focus the text field automatically
        this.overlay.querySelector('#popup-input')?.focus();
      });
    });
  }

  hide() {
    this.overlay.classList.remove('active');
    if (this.useBlur) {
      document.querySelector('main')?.classList.remove('content-blur-active');
    }
    this.overlay.addEventListener('transitionend', () => {
      this.overlay.remove();
    }, { once: true });
  }
}