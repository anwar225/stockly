'use client'

import { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { ProductsView } from '@/components/products/products-view'
import { ProductDialog } from '@/components/products/product-dialog'
import { DeleteConfirmDialog } from '@/components/products/delete-confirm-dialog'
import { CategoriesView } from '@/components/catalog/categories-view'
import { BrandsView } from '@/components/catalog/brands-view'
import { StockView } from '@/components/stock/stock-view'
import { MovementsView } from '@/components/movements/movements-view'
import { SettingsView } from '@/components/settings/settings-view'
import { SuppliersView } from '@/components/suppliers/suppliers-view'
import { SupplierDialog } from '@/components/suppliers/supplier-dialog'
import { DeleteConfirmDialog as SupplierDeleteDialog } from '@/components/suppliers/delete-confirm-dialog'
import { PurchasesView } from '@/components/purchases/purchases-view'
import { PurchaseDialog } from '@/components/purchases/purchase-dialog'
import { PurchaseDetailDialog } from '@/components/purchases/purchase-detail-dialog'
import { ReceiveConfirmDialog } from '@/components/purchases/receive-confirm-dialog'
import { CustomersView } from '@/components/customers/customers-view'
import { SalesView } from '@/components/sales/sales-view'
import { InvoicesView } from '@/components/invoices/invoices-view'
import { PaymentsView } from '@/components/payments/payments-view'
import { AnalyticsView } from '@/components/analytics/analytics-view'
import { EmptySoon } from '@/components/shared/empty-state'
import { getStatus } from '@/lib/stockly-data'
import type { ProductForm, Product, ApiProduct, ProductCreateInput } from '@/types/product.types'
import type { Category, ApiCategory, Brand, ApiBrand } from '@/types/catalog.types'
import type { Supplier, SupplierFormData } from '@/types/supplier.types'
import type { Purchase, PurchaseFormData } from '@/types/purchase.types'

const productSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  sku: z.string().min(2, 'La référence est requise'),
  brand: z.string().min(1, 'Choisissez une marque'),
  category: z.string().min(1, 'Choisissez une catégorie'),
  purchasePrice: z.number().positive('Prix invalide'),
  sellingPrice: z.number().positive('Prix invalide'),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  warranty: z.string().min(1, 'La garantie est requise'),
})

type View = 'dashboard' | 'products' | 'categories' | 'brands' | 'stock' | 'movements' | 'suppliers' | 'purchases' | 'customers' | 'sales' | 'invoices' | 'payments' | 'analytics' | 'settings' | 'soon'

export default function StocklyApp() {
  const [view, setView] = useState<View>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [notice, setNotice] = useState('')
  const [productList, setProductList] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('Tous les statuts')
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [brandList, setBrandList] = useState<Brand[]>([])
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [brandsError, setBrandsError] = useState<string | null>(null)
  const [supplierList, setSupplierList] = useState<Supplier[]>([])
  const [supplierModal, setSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null)
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [suppliersError, setSuppliersError] = useState<string | null>(null)
  const [purchaseList, setPurchaseList] = useState<Purchase[]>([])
  const [purchaseModal, setPurchaseModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [receiveConfirm, setReceiveConfirm] = useState(false)
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesError, setPurchasesError] = useState<string | null>(null)

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      brand: '',
      category: '',
      purchasePrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 1,
      warranty: '24 mois',
    },
  })

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/products')
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const apiProducts: ApiProduct[] = await response.json()
        
        // Convert ApiProduct to Product format
        const convertedProducts: Product[] = apiProducts.map((apiProduct) => ({
          id: apiProduct.id,
          name: apiProduct.name,
          sku: apiProduct.sku,
          brand: apiProduct.brand?.name || '',
          category: apiProduct.category?.name || '',
          purchasePrice: apiProduct.purchasePrice,
          sellingPrice: apiProduct.sellingPrice,
          stock: apiProduct.stock,
          minStock: apiProduct.minStock,
          warranty: '24 mois', // Default value since it's not in DB yet
          createdAt: apiProduct.createdAt,
        }))
        
        setProductList(convertedProducts)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Impossible de charger les produits')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        setCategoriesLoading(true)
        setCategoriesError(null)
        const response = await fetch('/api/categories')
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        
        const apiCategories: ApiCategory[] = await response.json()
        
        // Convert ApiCategory to Category format
        // Count products per category from productList
        const convertedCategories: Category[] = apiCategories.map((apiCategory) => {
          const productCount = productList.filter(p => p.category === apiCategory.name).length
          return {
            id: apiCategory.id,
            name: apiCategory.name,
            count: productCount,
            createdAt: new Date(apiCategory.createdAt).toLocaleDateString('fr-FR'),
          }
        })
        
        setCategoryList(convertedCategories)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setCategoriesError('Impossible de charger les catégories')
      } finally {
        setCategoriesLoading(false)
      }
    }
    
    fetchCategories()
  }, [productList])

  // Fetch brands from API
  useEffect(() => {
    async function fetchBrands() {
      try {
        setBrandsLoading(true)
        setBrandsError(null)
        const response = await fetch('/api/brands')
        
        if (!response.ok) {
          throw new Error('Failed to fetch brands')
        }
        
        const apiBrands: ApiBrand[] = await response.json()
        
        // Convert ApiBrand to Brand format
        // Count products per brand from productList
        const convertedBrands: Brand[] = apiBrands.map((apiBrand) => {
          const productCount = productList.filter(p => p.brand === apiBrand.name).length
          return {
            id: apiBrand.id,
            name: apiBrand.name,
            count: productCount,
          }
        })
        
        setBrandList(convertedBrands)
      } catch (err) {
        console.error('Error fetching brands:', err)
        setBrandsError('Impossible de charger les marques')
      } finally {
        setBrandsLoading(false)
      }
    }
    
    fetchBrands()
  }, [productList])

  // Fetch suppliers from API
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        setSuppliersLoading(true)
        setSuppliersError(null)
        const response = await fetch('/api/suppliers')
        
        if (!response.ok) {
          throw new Error('Failed to fetch suppliers')
        }
        
        const suppliers: Supplier[] = await response.json()
        setSupplierList(suppliers)
      } catch (err) {
        console.error('Error fetching suppliers:', err)
        setSuppliersError('Impossible de charger les fournisseurs')
      } finally {
        setSuppliersLoading(false)
      }
    }
    
    fetchSuppliers()
  }, [])

  // Fetch purchases from API
  useEffect(() => {
    async function fetchPurchases() {
      try {
        setPurchasesLoading(true)
        setPurchasesError(null)
        const response = await fetch('/api/purchases')
        
        if (!response.ok) {
          // Gérer spécifiquement les codes d'erreur HTTP
          if (response.status === 403) {
            setPurchasesError('Accès refusé : Les achats ne sont accessibles qu\'aux rôles OWNER, ADMIN et MANAGER')
            return
          }
          if (response.status === 401) {
            setPurchasesError('Non authentifié : Veuillez vous reconnecter')
            return
          }
          if (response.status === 500) {
            setPurchasesError('Erreur serveur : Impossible de charger les achats')
            return
          }
          throw new Error('Failed to fetch purchases')
        }
        
        const purchases: Purchase[] = await response.json()
        setPurchaseList(purchases)
      } catch (err) {
        console.error('Error fetching purchases:', err)
        // Ne pas écraser l'erreur spécifique si elle a déjà été définie
        if (!purchasesError) {
          setPurchasesError('Impossible de charger les achats')
        }
      } finally {
        setPurchasesLoading(false)
      }
    }
    
    fetchPurchases()
  }, [])

  const filteredProducts = useMemo(
    () =>
      productList.filter(
        (p) =>
          `${p.name} ${p.sku} ${p.brand} ${p.category}`.toLowerCase().includes(search.toLowerCase()) &&
          (statusFilter === 'Tous les statuts' || getStatus(p) === statusFilter)
      ),
    [productList, search, statusFilter]
  )

  const filteredSuppliers = useMemo(
    () =>
      supplierList.filter(
        (s) =>
          `${s.name} ${s.contactName || ''} ${s.phone || ''} ${s.email || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [supplierList, search]
  )

  const filteredPurchases = useMemo(
    () =>
      purchaseList.filter(
        (p) =>
          `${p.reference} ${p.supplier?.name || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [purchaseList, search]
  )

  const go = (next: View) => {
    setView(next)
    setMobileOpen(false)
    setSearch('')
  }

  const submitProduct = async (data: ProductForm) => {
    try {
      setIsSubmitting(true)
      
      // Find categoryId and brandId from the selected names
      const selectedCategory = categoryList.find(c => c.name === data.category)
      const selectedBrand = brandList.find(b => b.name === data.brand)
      
      // Convert ProductForm to ProductCreateInput
      const createData: ProductCreateInput = {
        name: data.name,
        sku: data.sku,
        description: data.name, // Using name as description for now
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stock: data.stock,
        minStock: data.minStock,
        categoryId: selectedCategory?.id,
        brandId: selectedBrand?.id,
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }
      
      const newProduct: ApiProduct = await response.json()
      
      // Convert ApiProduct to Product format
      const convertedProduct: Product = {
        id: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku,
        brand: newProduct.brand?.name || data.brand,
        category: newProduct.category?.name || data.category,
        purchasePrice: newProduct.purchasePrice,
        sellingPrice: newProduct.sellingPrice,
        stock: newProduct.stock,
        minStock: newProduct.minStock,
        warranty: data.warranty,
        createdAt: newProduct.createdAt,
      }
      
      setProductList((prev) => [convertedProduct, ...prev])
      setProductModal(false)
      form.reset()
      setNotice('Produit ajouté au catalogue')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error creating product:', err)
      setNotice('Erreur lors de l\'ajout du produit')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitSupplier = async (data: SupplierFormData) => {
    try {
      setIsSubmitting(true)
      
      // Trim and convert empty strings to null
      const payload = {
        name: data.name.trim(),
        contactName: data.contactName?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      }
      
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save supplier')
      }
      
      const savedSupplier: Supplier = await response.json()
      
      if (editingSupplier) {
        setSupplierList((prev) => prev.map((s) => (s.id === editingSupplier.id ? savedSupplier : s)))
        setNotice('Fournisseur modifié')
      } else {
        setSupplierList((prev) => [savedSupplier, ...prev])
        setNotice('Fournisseur ajouté')
      }
      
      setSupplierModal(false)
      setEditingSupplier(null)
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error saving supplier:', err)
      setNotice('Erreur lors de la sauvegarde du fournisseur')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!deleteSupplier) return
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/suppliers/${deleteSupplier.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          throw new Error(errorData.error || 'Impossible de supprimer ce fournisseur car il possède des achats associés')
        }
        throw new Error(errorData.error || 'Failed to delete supplier')
      }
      
      setSupplierList((prev) => prev.filter((s) => s.id !== deleteSupplier.id))
      setDeleteSupplier(null)
      setNotice('Fournisseur supprimé')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error deleting supplier:', err)
      setNotice(err instanceof Error ? err.message : 'Erreur lors de la suppression du fournisseur')
      setTimeout(() => setNotice(''), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitPurchase = async (data: PurchaseFormData) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create purchase')
      }
      
      const result = await response.json()
      const newPurchase: Purchase = result.purchase
      
      setPurchaseList((prev) => [newPurchase, ...prev])
      setPurchaseModal(false)
      setNotice('Achat créé')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error creating purchase:', err)
      setNotice('Erreur lors de la création de l\'achat')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderPurchase = async () => {
    if (!selectedPurchase) return
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/purchases/${selectedPurchase.id}/order`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to order purchase')
      }
      
      const updatedPurchase: Purchase = await response.json()
      setPurchaseList((prev) => prev.map((p) => (p.id === selectedPurchase.id ? updatedPurchase : p)))
      setSelectedPurchase(updatedPurchase)
      setNotice('Achat commandé')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error ordering purchase:', err)
      setNotice('Erreur lors de la commande')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceivePurchase = async () => {
    if (!selectedPurchase) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/purchases/${selectedPurchase.id}/receive`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to receive purchase')
      }

      const updatedPurchase: Purchase = await response.json()
      setPurchaseList((prev) => prev.map((p) => (p.id === selectedPurchase.id ? updatedPurchase : p)))
      setSelectedPurchase(updatedPurchase)
      setReceiveConfirm(false)

      // Refresh products to update stock
      const productsResponse = await fetch('/api/products')
      if (productsResponse.ok) {
        const apiProducts: ApiProduct[] = await productsResponse.json()
        const convertedProducts: Product[] = apiProducts.map((apiProduct) => ({
          id: apiProduct.id,
          name: apiProduct.name,
          sku: apiProduct.sku,
          brand: apiProduct.brand?.name || '',
          category: apiProduct.category?.name || '',
          purchasePrice: apiProduct.purchasePrice,
          sellingPrice: apiProduct.sellingPrice,
          stock: apiProduct.stock,
          minStock: apiProduct.minStock,
          warranty: '24 mois',
          createdAt: apiProduct.createdAt,
        }))
        setProductList(convertedProducts)
      }

      setNotice('Achat réceptionné - Stock mis à jour')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error receiving purchase:', err)
      setNotice('Erreur lors de la réception')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelPurchase = async (purchaseId: string) => {
    if (!confirm('Annuler cet achat ?')) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/purchases/${purchaseId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel purchase')
      }

      const updatedPurchase: Purchase = await response.json()
      setPurchaseList((prev) => prev.map((p) => (p.id === purchaseId ? updatedPurchase : p)))
      if (selectedPurchase?.id === purchaseId) {
        setSelectedPurchase(updatedPurchase)
      }
      setNotice('Achat annulé.')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      console.error('Error cancelling purchase:', err)
      setNotice('Erreur lors de l\'annulation.')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-slate-900">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        view={view}
        onNavigate={go}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]'}`}>
        <Header
          collapsed={collapsed}
          search={search}
          onSearchChange={setSearch}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9">
          {view === 'dashboard' && <DashboardView products={productList} go={go} />}
          {view === 'products' && (
            <ProductsView
              products={filteredProducts}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onAdd={() => setProductModal(true)}
              onDelete={setDeleteProduct}
              loading={loading}
              error={error}
            />
          )}
          {view === 'stock' && (
            <StockView
              products={filteredProducts}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              loading={loading}
              error={error}
            />
          )}
          {view === 'movements' && (
            <MovementsView 
              products={productList} 
              onRefreshProducts={() => {
                // Re-fetch products to update stock
                async function refreshProducts() {
                  try {
                    const response = await fetch('/api/products')
                    if (response.ok) {
                      const apiProducts: ApiProduct[] = await response.json()
                      const convertedProducts: Product[] = apiProducts.map((apiProduct) => ({
                        id: apiProduct.id,
                        name: apiProduct.name,
                        sku: apiProduct.sku,
                        brand: apiProduct.brand?.name || '',
                        category: apiProduct.category?.name || '',
                        purchasePrice: apiProduct.purchasePrice,
                        sellingPrice: apiProduct.sellingPrice,
                        stock: apiProduct.stock,
                        minStock: apiProduct.minStock,
                        warranty: '24 mois',
                        createdAt: apiProduct.createdAt,
                      }))
                      setProductList(convertedProducts)
                    }
                  } catch (err) {
                    console.error('Error refreshing products:', err)
                  }
                }
                refreshProducts()
              }}
            />
          )}
          {view === 'categories' && (
            <CategoriesView 
              categories={categoryList} 
              loading={categoriesLoading} 
              error={categoriesError} 
            />
          )}
          {view === 'brands' && (
            <BrandsView 
              brands={brandList} 
              loading={brandsLoading} 
              error={brandsError} 
            />
          )}
          {view === 'suppliers' && (
            <SuppliersView
              suppliers={filteredSuppliers}
              search={search}
              setSearch={setSearch}
              onAdd={() => {
                setEditingSupplier(null)
                setSupplierModal(true)
              }}
              onEdit={(supplier) => {
                setEditingSupplier(supplier)
                setSupplierModal(true)
              }}
              onDelete={setDeleteSupplier}
              loading={suppliersLoading}
              error={suppliersError}
            />
          )}
          {view === 'purchases' && (
            <PurchasesView
              purchases={filteredPurchases}
              search={search}
              setSearch={setSearch}
              onAdd={() => setPurchaseModal(true)}
              onViewDetail={setSelectedPurchase}
              loading={purchasesLoading}
              error={purchasesError}
            />
          )}
          {view === 'customers' && <CustomersView />}
          {view === 'sales' && <SalesView />}
          {view === 'invoices' && <InvoicesView />}
          {view === 'payments' && <PaymentsView />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'settings' && (
            <SettingsView
              onSave={() => {
                setNotice('Modifications enregistrées')
                setTimeout(() => setNotice(''), 3000)
              }}
            />
          )}
          {view === 'soon' && <EmptySoon />}
        </main>
      </div>
      {notice && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-slate-900">✓</div>
          {notice}
        </div>
      )}
      {productModal && (
        <ProductDialog form={form} onClose={() => setProductModal(false)} onSubmit={submitProduct} isLoading={isSubmitting} categories={categoryList} brands={brandList} />
      )}
      {deleteProduct && (
        <DeleteConfirmDialog
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={() => {
            setProductList((prev) => prev.filter((p) => p.id !== deleteProduct.id))
            setDeleteProduct(null)
            setNotice('Produit supprimé')
            setTimeout(() => setNotice(''), 3000)
          }}
        />
      )}
      {supplierModal && (
        <SupplierDialog
          isOpen={supplierModal}
          onClose={() => {
            setSupplierModal(false)
            setEditingSupplier(null)
          }}
          onSubmit={submitSupplier}
          supplier={editingSupplier}
          isSubmitting={isSubmitting}
        />
      )}
      {deleteSupplier && (
        <SupplierDeleteDialog
          isOpen={!!deleteSupplier}
          onClose={() => setDeleteSupplier(null)}
          onConfirm={handleDeleteSupplier}
          supplierName={deleteSupplier.name}
          isDeleting={isSubmitting}
        />
      )}
      {purchaseModal && (
        <PurchaseDialog
          isOpen={purchaseModal}
          onClose={() => setPurchaseModal(false)}
          onSubmit={submitPurchase}
          products={productList}
          suppliers={supplierList}
          isSubmitting={isSubmitting}
        />
      )}
      {selectedPurchase && (
        <PurchaseDetailDialog
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          purchase={selectedPurchase}
          onOrder={handleOrderPurchase}
          onReceiveRequest={() => setReceiveConfirm(true)}
          onCancel={handleCancelPurchase}
          isProcessing={isSubmitting}
        />
      )}
      {receiveConfirm && selectedPurchase && (
        <ReceiveConfirmDialog
          isOpen={receiveConfirm}
          onClose={() => setReceiveConfirm(false)}
          onConfirm={handleReceivePurchase}
          purchaseReference={selectedPurchase.reference}
          isReceiving={isSubmitting}
        />
      )}
    </div>
  )
}
