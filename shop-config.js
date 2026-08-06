(() => {
  window.SnackShopConfig = Object.freeze({
    enabled: false,
    testMode: true,
    provider: 'disabled',
    currency: 'EUR',
    products: [
      { id: 'coins_small', title: 'Petit sachet de pièces', description: 'Produit de démonstration — achat désactivé.', price: 1.99, icon: '🪙', enabled: false },
      { id: 'boosters_pack', title: 'Pack de boosters', description: 'Produit de démonstration — achat désactivé.', price: 2.99, icon: '💥', enabled: false },
      { id: 'remove_ads', title: 'Retirer les publicités', description: 'Produit de démonstration — achat désactivé.', price: 3.99, icon: '🚫', enabled: false }
    ]
  });
})();
