(() => {
  /**
   * Boutique Snack Attack
   *
   * IMPORTANT : laisser enabled à false tant que la boutique n'est pas prête,
   * que les produits ne sont pas déclarés et que le moyen de paiement adapté
   * à la distribution de l'application n'est pas configuré.
   *
   * Pour une version publiée sur Google Play et vendant des éléments numériques,
   * utiliser Google Play Billing. PayPal ne doit être activé que dans un cadre
   * autorisé (par exemple distribution hors Play, biens physiques ou contribution
   * sans avantage numérique), après vérification des règles applicables.
   */
  window.SnackShopConfig = Object.freeze({
    enabled: false,
    testMode: true,
    provider: 'disabled',
    currency: 'EUR',
    products: [
      {
        id: 'coins_small',
        title: 'Petit sachet de pièces',
        description: 'Produit de démonstration — achat désactivé.',
        price: 1.99,
        icon: '🪙',
        enabled: false
      },
      {
        id: 'boosters_pack',
        title: 'Pack de boosters',
        description: 'Produit de démonstration — achat désactivé.',
        price: 2.99,
        icon: '💥',
        enabled: false
      },
      {
        id: 'remove_ads',
        title: 'Retirer les publicités',
        description: 'Produit de démonstration — achat désactivé.',
        price: 3.99,
        icon: '🚫',
        enabled: false
      }
    ]
  });
})();
