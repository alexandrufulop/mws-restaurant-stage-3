/**
 *
 * Project: mws-restaurant-stage-3
 * Generated: 30-06-2018 @ 10:44 PM
 *
 */

class Modal {
    constructor(overlay) {
        this.overlay = overlay;
    }
    open() {
        this.overlay.classList.remove('is-hidden');
    }

    close() {
        this.overlay.classList.add('is-hidden');
    }
}
const modal = new Modal(document.querySelector('.modal-overlay'));
window.openModal = modal.open.bind(modal);
window.closeModal = modal.close.bind(modal);