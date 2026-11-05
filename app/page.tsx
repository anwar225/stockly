import Link from 'next/link'
import { Package, BarChart3, Users, Archive, TrendingUp, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f9f8]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-slate-950">Stockly</span>
        </div>
        <Link
          href="/login"
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Se connecter
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-950 leading-tight mb-6 tracking-tight">
              La gestion simple de votre
              <span className="text-emerald-600"> magasin d'électroménager</span>
            </h1>
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">
              Stockly vous aide à gérer votre catalogue, votre stock, vos ventes et vos achats en toute simplicité.
              Une solution complète adaptée aux besoins des magasins d'électroménager.
            </p>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-lg"
              >
                Commencer
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-emerald-600 hover:text-emerald-600 transition-colors font-semibold text-lg"
              >
                En savoir plus
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">Gestion du Stock</h3>
                    <p className="text-sm text-slate-500">Suivi en temps réel</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">Ventes & Factures</h3>
                    <p className="text-sm text-slate-500">Automatisé et simple</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">Analytics</h3>
                    <p className="text-sm text-slate-500">Tableaux de bord clairs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-center text-slate-950 mb-12 tracking-tight">
            Fonctionnalités principales
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">Catalogue Produits</h3>
              <p className="text-slate-500">Gérez vos produits, catégories et marques avec une interface intuitive.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Archive className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">Gestion des Stocks</h3>
              <p className="text-slate-500">Suivez vos stocks en temps réel et gérez les mouvements facilement.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">Ventes & Factures</h3>
              <p className="text-slate-500">Créez des ventes, générez des factures et suivez les paiements.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Archive className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">Achats & Fournisseurs</h3>
              <p className="text-slate-500">Gérez vos fournisseurs et suivez vos commandes d'achat.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">Clients</h3>
              <p className="text-slate-500">Gérez votre base de clients et leur historique d'achats.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">Analytics</h3>
              <p className="text-slate-500">Tableaux de bord et rapports pour prendre les bonnes décisions.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center bg-emerald-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Prêt à transformer votre gestion ?</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Commencez à utiliser Stockly dès maintenant et simplifiez la gestion de votre magasin.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-lg"
          >
            Se connecter maintenant
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-slate-950 font-semibold">Stockly</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 Stockly. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
