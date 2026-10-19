# GUIDE DE TESTS MANUELS - MVP STOCKLY

## PRÉREQUIS

- Application lancée sur http://localhost:3000
- Données de test préparées (exécuter `npx tsx scripts/prepare-test-data.ts`)
- Compte OWNER/ADMIN/MANAGER disponible : admin@stockly.ma
- Compte EMPLOYEE disponible : employee-test@stockly.ma / EmployeeTest123!

## DONNÉES DE TEST

Après exécution de `prepare-test-data.ts`, vous devriez avoir :

- **Store ID** : cmu2w7n33000138tyye6uawj3
- **Supplier ID** : cmv9u6dhb0000astyg600613a (TEST-Fournisseur Pilote)
- **Customer ID** : cmv9u6dk10001astyptbjdxeq (TEST-Client Pilote)
- **Product ID (stock=10)** : cmv9u6drt0004asty2qtb1ek9 (TEST-Produit Pilote, SKU: TEST-PILOTE-001)
- **Product ID (stock=3)** : cmv9u6duk0005astyv2rjku65 (TEST-Produit Stock Faible, SKU: TEST-LOW-STOCK-001)
- **Product ID (stock=2)** : cmv9u6dxc0006astygser0gw7 (TEST-Produit Mouvement, SKU: TEST-MOVEMENT-001)

---

## TEST 1 : RÉCEPTION D'ACHAT AVEC DOUBLE REQUÊTE

### Objectif
Vérifier qu'un achat ne peut pas être réceptionné deux fois, même avec des requêtes simultanées.

### Prérequis
- Compte OWNER/ADMIN/MANAGER connecté
- Fournisseur TEST-Fournisseur Pilote disponible
- Produit TEST-Produit Pilote (stock=10) disponible

### Étapes

#### Étape 1 : Créer un achat DRAFT
1. Connectez-vous avec admin@stockly.ma
2. Allez dans la vue "Achats"
3. Cliquez sur "Ajouter un achat"
4. Sélectionnez "TEST-Fournisseur Pilote"
5. Ajoutez le produit "TEST-Produit Pilote" avec :
   - Quantité : 5
   - Prix unitaire : 100
6. Cliquez sur "Créer"
7. **Résultat attendu** : Achat créé avec statut DRAFT
8. **Notez l'ID de l'achat** (visible dans l'URL ou dans la réponse API)

#### Étape 2 : Commander l'achat
1. Sur l'achat créé, cliquez sur "Commander"
2. **Résultat attendu** : Statut passe à ORDERED

#### Étape 3 : Vérifier le stock initial
1. Allez dans la vue "Produits"
2. Trouvez "TEST-Produit Pilote"
3. **Notez le stock actuel** (devrait être 10)
4. Ou utilisez l'API : `GET http://localhost:3000/api/stock`

#### Étape 4 : Première réception
1. Retournez dans "Achats"
2. Sur l'achat ORDERED, cliquez sur "Réceptionner"
3. **Résultat attendu** :
   - HTTP 200 OK
   - Statut passe à RECEIVED
   - Stock augmente de 5 (devrait être 15)

#### Étape 5 : Vérifier le stock après première réception
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Pilote"
3. **Résultat attendu** : Stock = 15 (10 + 5)

#### Étape 6 : Deuxième réception (doit échouer)
1. Essayez de cliquer à nouveau sur "Réceptionner"
2. **Résultat attendu** :
   - HTTP 400 Bad Request
   - Message d'erreur : "Cet achat ne peut pas être réceptionné. Statut actuel: RECEIVED"

#### Étape 7 : Vérifier le stock final
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Pilote"
3. **Résultat attendu** : Stock = 15 (pas 20)

### Test de double requête simultanée (optionnel)

Pour tester réellement la simultanéité, utilisez deux terminaux :

**Terminal 1 :**
```bash
curl -X POST http://localhost:3000/api/purchases/[PURCHASE_ID]/receive \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=[VOTRE_COOKIE]" \
  -v
```

**Terminal 2 (exécutez immédiatement après le terminal 1) :**
```bash
curl -X POST http://localhost:3000/api/purchases/[PURCHASE_ID]/receive \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=[VOTRE_COOKIE]" \
  -v
```

**Résultat attendu :**
- Une requête retourne 200 OK
- L'autre retourne 400 Bad Request
- Le stock n'est incrémenté qu'une seule fois

### Critères de succès
- ✅ Première réception : 200 OK
- ✅ Deuxième réception : 400 Bad Request
- ✅ Stock final = stock initial + 5 (pas +10)
- ✅ Message d'erreur explicite

---

## TEST 2 : CONFIRMATION DE VENTE AVEC STOCK INSUFFISANT

### Objectif
Vérifier que la confirmation échoue si le stock est insuffisant.

### Prérequis
- Compte OWNER/ADMIN/MANAGER/EMPLOYEE connecté
- Client TEST-Client Pilote disponible
- Produit TEST-Produit Stock Faible (stock=3) disponible

### Étapes

#### Étape 1 : Vérifier le stock initial
1. Allez dans "Produits"
2. Trouvez "TEST-Produit Stock Faible"
3. **Notez le stock actuel** (devrait être 3)

#### Étape 2 : Créer une vente DRAFT avec quantité > stock
1. Allez dans "Ventes"
2. Cliquez sur "Ajouter une vente"
3. Sélectionnez "TEST-Client Pilote"
4. Ajoutez le produit "TEST-Produit Stock Faible" avec :
   - Quantité : 5 (supérieur au stock de 3)
   - Prix unitaire : 75
5. Cliquez sur "Créer"
6. **Résultat attendu** : Vente créée avec statut DRAFT

#### Étape 3 : Confirmer la vente (doit échouer)
1. Sur la vente créée, cliquez sur "Confirmer"
2. **Résultat attendu** :
   - HTTP 409 Conflict
   - Message d'erreur : "Insufficient stock for product: TEST-Produit Stock Faible"

#### Étape 4 : Vérifier que le stock n'a pas changé
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Stock Faible"
3. **Résultat attendu** : Stock = 3 (inchangé)

### Critères de succès
- ✅ Confirmation : 409 Conflict
- ✅ Message d'erreur contient "Insufficient stock"
- ✅ Stock inchangé

---

## TEST 3 : CONFIRMATION DE VENTE AVEC DOUBLE REQUÊTE

### Objectif
Vérifier qu'une vente ne peut pas être confirmée deux fois.

### Prérequis
- Compte OWNER/ADMIN/MANAGER/EMPLOYEE connecté
- Client TEST-Client Pilote disponible
- Produit TEST-Produit Pilote (stock après test 1 = 15) disponible

### Étapes

#### Étape 1 : Vérifier le stock initial
1. Allez dans "Produits"
2. Trouvez "TEST-Produit Pilote"
3. **Notez le stock actuel** (devrait être 15 après le test 1)

#### Étape 2 : Créer une vente DRAFT
1. Allez dans "Ventes"
2. Cliquez sur "Ajouter une vente"
3. Sélectionnez "TEST-Client Pilote"
4. Ajoutez le produit "TEST-Produit Pilote" avec :
   - Quantité : 3
   - Prix unitaire : 150
5. Cliquez sur "Créer"
6. **Résultat attendu** : Vente créée avec statut DRAFT

#### Étape 3 : Première confirmation
1. Sur la vente créée, cliquez sur "Confirmer"
2. **Résultat attendu** :
   - HTTP 200 OK
   - Statut passe à CONFIRMED
   - Stock diminue de 3 (devrait être 12)

#### Étape 4 : Vérifier le stock après première confirmation
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Pilote"
3. **Résultat attendu** : Stock = 12 (15 - 3)

#### Étape 5 : Deuxième confirmation (doit échouer)
1. Essayez de cliquer à nouveau sur "Confirmer"
2. **Résultat attendu** :
   - HTTP 409 Conflict
   - Message d'erreur : "Seule une vente en brouillon peut être confirmée"

#### Étape 6 : Vérifier le stock final
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Pilote"
3. **Résultat attendu** : Stock = 12 (pas 9)

### Test de double requête simultanée (optionnel)

Même procédure que le test 1 avec l'endpoint `/api/sales/[SALE_ID]/confirm`.

### Critères de succès
- ✅ Première confirmation : 200 OK
- ✅ Deuxième confirmation : 409 Conflict
- ✅ Stock final = stock initial - 3 (pas -6)
- ✅ Message d'erreur explicite

---

## TEST 4 : PERMISSIONS RBAC - ACHATS (EMPLOYEE)

### Objectif
Vérifier qu'un EMPLOYEE ne peut pas accéder aux achats.

### Prérequis
- Compte EMPLOYEE : employee-test@stockly.ma / EmployeeTest123!

### Étapes

#### Étape 1 : Se connecter avec EMPLOYEE
1. Déconnectez-vous si nécessaire
2. Connectez-vous avec employee-test@stockly.ma
3. Mot de passe : EmployeeTest123!

#### Étape 2 : Essayer d'accéder aux achats via l'UI
1. Essayez d'aller dans la vue "Achats"
2. **Résultat attendu** :
   - Soit l'onglet "Achats" n'est pas visible
   - Soit un message d'erreur "Accès refusé" s'affiche

#### Étape 3 : Essayer via l'API (GET)
1. Ouvrez les DevTools (F12)
2. Dans la console, exécutez :
```javascript
fetch('http://localhost:3000/api/purchases')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```
3. **Résultat attendu** :
   - HTTP 403 Forbidden
   - Message : "Permissions insuffisantes"

#### Étape 4 : Essayer via l'API (POST)
1. Dans la console, exécutez :
```javascript
fetch('http://localhost:3000/api/purchases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    supplierId: '[SUPPLIER_ID]',
    purchaseDate: new Date().toISOString(),
    items: [{ productId: '[PRODUCT_ID]', quantity: 1, unitPrice: 100 }]
  })
})
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```
2. **Résultat attendu** :
   - HTTP 403 Forbidden
   - Message : "Permissions insuffisantes"

### Critères de succès
- ✅ GET /api/purchases : 403 Forbidden
- ✅ POST /api/purchases : 403 Forbidden
- ✅ Message d'erreur : "Permissions insuffisantes"

---

## TEST 5 : PERMISSIONS RBAC - VENTES (EMPLOYEE)

### Objectif
Vérifier qu'un EMPLOYEE peut créer et confirmer des ventes.

### Prérequis
- Compte EMPLOYEE : employee-test@stockly.ma / EmployeeTest123!
- Client TEST-Client Pilote disponible
- Produit TEST-Produit Pilote disponible

### Étapes

#### Étape 1 : Se connecter avec EMPLOYEE
1. Déconnectez-vous si nécessaire
2. Connectez-vous avec employee-test@stockly.ma
3. Mot de passe : EmployeeTest123!

#### Étape 2 : Créer une vente DRAFT
1. Allez dans "Ventes"
2. Cliquez sur "Ajouter une vente"
3. Sélectionnez "TEST-Client Pilote"
4. Ajoutez le produit "TEST-Produit Pilote" avec :
   - Quantité : 1
   - Prix unitaire : 150
5. Cliquez sur "Créer"
6. **Résultat attendu** :
   - HTTP 201 Created
   - Vente créée avec statut DRAFT

#### Étape 3 : Confirmer la vente
1. Sur la vente créée, cliquez sur "Confirmer"
2. **Résultat attendu** :
   - HTTP 200 OK
   - Statut passe à CONFIRMED
   - Stock diminue de 1

#### Étape 4 : Vérifier le stock
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Pilote"
3. **Résultat attendu** : Stock décrémenté de 1

### Critères de succès
- ✅ POST /api/sales : 201 Created
- ✅ POST /api/sales/[id]/confirm : 200 OK
- ✅ Stock décrémenté correctement

---

## TEST 6 : MOUVEMENT OUT AVEC STOCK INSUFFISANT

### Objectif
Vérifier qu'un mouvement OUT échoue si le stock est insuffisant.

### Prérequis
- Compte OWNER/ADMIN/MANAGER connecté
- Produit TEST-Produit Mouvement (stock=2) disponible

### Étapes

#### Étape 1 : Vérifier le stock initial
1. Allez dans "Produits"
2. Trouvez "TEST-Produit Mouvement"
3. **Notez le stock actuel** (devrait être 2)

#### Étape 2 : Créer un mouvement OUT avec quantité > stock
1. Allez dans "Mouvements"
2. Cliquez sur "Ajouter un mouvement"
3. Sélectionnez "TEST-Produit Mouvement"
4. Type : OUT
5. Quantité : 5 (supérieur au stock de 2)
6. Raison : TEST-Mouvement OUT
7. Cliquez sur "Créer"
8. **Résultat attendu** :
   - HTTP 409 Conflict
   - Message d'erreur : "Stock insuffisant. Stock actuel: 2, Quantité demandée: 5"

#### Étape 3 : Vérifier que le stock n'a pas changé
1. Allez dans "Produits"
2. Vérifiez le stock de "TEST-Produit Mouvement"
3. **Résultat attendu** : Stock = 2 (inchangé)

### Critères de succès
- ✅ POST /api/movements : 409 Conflict
- ✅ Message d'erreur contient "Stock insuffisant"
- ✅ Stock inchangé

---

## TABLEAU DE RÉSULTATS

Après avoir exécuté tous les tests, remplissez ce tableau :

| Test | Résultat | Preuve | Notes |
|------|----------|--------|-------|
| TEST 1 : Réception d'achat double | PASS / FAIL / NON TESTÉ | | |
| TEST 2 : Confirmation vente stock insuffisant | PASS / FAIL / NON TESTÉ | | |
| TEST 3 : Confirmation vente double | PASS / FAIL / NON TESTÉ | | |
| TEST 4 : Permissions RBAC Achats | PASS / FAIL / NON TESTÉ | | |
| TEST 5 : Permissions RBAC Ventes | PASS / FAIL / NON TESTÉ | | |
| TEST 6 : Mouvement OUT stock insuffisant | PASS / FAIL / NON TESTÉ | | |

---

## NETTOYAGE

Après les tests, vous pouvez nettoyer les données de test en exécutant :

```bash
npx tsx scripts/prepare-test-data.ts
```

Cela supprimera toutes les données avec le préfixe "TEST-" et recréera les données de test initiales.
