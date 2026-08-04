(() => {
  const config = window.SnackShopConfig;
  if (!config?.enabled) return;

  function money(value) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: config.currency || 'EUR'
    }).format(value);
  }

  function closeShop() {
    document.getElementById('snackShopOverlay')?.classList.remove('show');
  }

  function openShop() {
    document.getElementById('snackShopOverlay')?.classList.add('show');
  }

  function buildShop() {
    const menuCard = document.querySelector('.start-card');
    if (!menuCard || document.getElementById('shopBtn')) return;

    const button = document.createElement('button');
    button.id = 'shopBtn';
    button.className = 'mainbtn snack-shop-button';
    button.type = 'button';
    button.textContent = '🛍️ Boutique';
    button.addEventListener('click', openShop);
    menuCard.appendChild(button);

    const overlay = document.createElement('div');
    overlay.id = 'snackShopOverlay';
    overlay.className = 'snack-shop-overlay';
    overlay.innerHTML = `
      <section class="snack-shop-panel" role="dialog" aria-modal="true" aria-labelledby="snackShopTitle">
        <button class="snack-shop-close" type="button" aria-label="Fermer">×</button>
        <div class="snack-shop-logo">🛍️</div>
        <h2 id="snackShopTitle">Boutique Snack Attack</h2>
        <p class="snack-shop-note">${config.testMode ? 'Mode préparation — aucun paiement réel.' : 'Choisis un article.'}</p>
        <div class="snack-shop-products"></div>
      </section>`;

    const products = overlay.querySelector('.snack-shop-products');
    for (const product of config.products || []) {
      const card = document.createElement('article');
      card.className = 'snack-shop-product';
      card.innerHTML = `
        <span class="snack-shop-product-icon">${product.icon || '🎁'}</span>
        <div class="snack-shop-product-copy">
          <strong>${product.title}</strong>
          <small>${product.description || ''}</small>
        </div>
        <button type="button" disabled>${money(product.price)}</button>`;
      products.appendChild(card);
    }

    overlay.querySelector('.snack-shop-close').addEventListener('click', closeShop);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeShop();
    });
    document.body.appendChild(overlay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildShop, { once: true });
  } else {
    buildShop();
  }
})();
