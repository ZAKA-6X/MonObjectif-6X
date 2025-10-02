(function(){
  const QUEUE = [];
  let container = null;
  const AUTO_DISMISS_MS = 3500;

  function ensureContainer(){
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  function removeToast(toast){
    toast.style.animation = 'toast-out .25s ease forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    }, { once:true });
  }

  function createToast(message, type){
    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;

    const text = document.createElement('div');
    text.className = 'toast-message';
    text.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => removeToast(toast));

    toast.appendChild(text);
    toast.appendChild(closeBtn);

    ensureContainer().appendChild(toast);

    setTimeout(() => {
      if (toast.isConnected) removeToast(toast);
    }, AUTO_DISMISS_MS);
  }

  function showToast(message, type){
    if (!document.body) {
      QUEUE.push({ message, type });
      return;
    }
    createToast(String(message), type);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureContainer();
      QUEUE.splice(0).forEach(item => createToast(item.message, item.type));
    });
  } else {
    ensureContainer();
  }

  window.showAlert = function(message, type){
    showToast(message, type || 'info');
  };

  window.alert = function(message){
    showToast(message, 'info');
  };
})();
