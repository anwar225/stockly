'use client'

import { useMemo, useState } from 'react'
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
import { EmptySoon } from '@/components/shared/empty-state'
import { products, categories, brands, getStatus } from '@/lib/stockly-data'
import type { ProductForm, Product } from '@/types'

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

type View = 'dashboard' | 'products' | 'categories' | 'brands' | 'stock' | 'movements' | 'settings' | 'soon'

export default function StocklyApp() {
  const [view, setView] = useState<View>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [notice, setNotice] = useState('')
  const [productList, setProductList] = useState(products)
  const [statusFilter, setStatusFilter] = useState('Tous les statuts')

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

  const filteredProducts = useMemo(
    () =>
      productList.filter(
        (p) =>
          `${p.name} ${p.sku} ${p.brand} ${p.category}`.toLowerCase().includes(search.toLowerCase()) &&
          (statusFilter === 'Tous les statuts' || getStatus(p) === statusFilter)
      ),
    [productList, search, statusFilter]
  )

  const go = (next: View) => {
    setView(next)
    setMobileOpen(false)
    setSearch('')
  }

  const submitProduct = (data: ProductForm) => {
    setProductList((prev) => [{ ...data, id: `new-${Date.now()}` }, ...prev])
    setProductModal(false)
    form.reset()
    setNotice('Produit ajouté au catalogue')
    setTimeout(() => setNotice(''), 3000)
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
            />
          )}
          {view === 'stock' && (
            <StockView
              products={filteredProducts}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )}
          {view === 'movements' && <MovementsView />}
          {view === 'categories' && <CategoriesView categories={categories} />}
          {view === 'brands' && <BrandsView brands={brands} />}
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
        <ProductDialog form={form} onClose={() => setProductModal(false)} onSubmit={submitProduct} />
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
    </div>
  )
}
