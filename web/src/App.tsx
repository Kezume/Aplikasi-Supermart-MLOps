/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Store, Library, FileText, Sparkles, Layers, CheckCircle2, RefreshCw, Settings, ShieldAlert } from "lucide-react";
import { Product, AssociationRule } from "./data";
import ProductGrid from "./components/ProductGrid";
import CartView from "./components/CartView";
import RulesTable from "./components/RulesTable";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"toko" | "keranjang" | "rules">("toko");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rules, setRules] = useState<AssociationRule[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isRetraining, setIsRetraining] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3005";

  // Fetch initial data from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to load products:", err));

    fetch(`${API_BASE_URL}/api/rules`)
      .then(res => res.json())
      .then(data => setRules(data))
      .catch(err => console.error("Failed to load rules:", err));
  }, []);

  // Load cart from localStorage on init
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("apriori_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
    }
  }, []);

  // Save cart to localStorage on state changes
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("apriori_cart", JSON.stringify(newCart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  };

  // Helper dictionary count of items in cart (for catalog badging)
  const cartItemsCount = useMemo(() => {
    const counts: { [key: string]: number } = {};
    cart.forEach((item) => {
      counts[item.product.name] = item.quantity;
    });
    return counts;
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.name === product.name);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1 });
    }

    saveCart(updatedCart);
    triggerToast(`Ditambahkan ke keranjang: ${product.name}`);
  };

  const handleUpdateQuantity = (productName: string, delta: number) => {
    const existingIndex = cart.findIndex((item) => item.product.name === productName);
    if (existingIndex === -1) return;

    let updatedCart = [...cart];
    const newQty = updatedCart[existingIndex].quantity + delta;

    if (newQty <= 0) {
      updatedCart.splice(existingIndex, 1);
    } else {
      updatedCart[existingIndex].quantity = newQty;
    }

    saveCart(updatedCart);
  };

  const handleRemoveItem = (productName: string) => {
    const updatedCart = cart.filter((item) => item.product.name !== productName);
    saveCart(updatedCart);
  };

  const handleClearCart = () => {
    saveCart([]);
    triggerToast("Keranjang berhasil dikosongkan");
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart.map(item => ({ product_name: item.product.name }))
        })
      });

      if (response.ok) {
        handleClearCart();
        triggerToast("Checkout berhasil! Transaksi tersimpan ke database.");
      } else {
        triggerToast("Gagal melakukan checkout.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    triggerToast("Memulai retraining model... Silakan tunggu.");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/retrain`, {
        method: "POST"
      });

      if (response.ok) {
        triggerToast("Model berhasil diupdate dengan transaksi terbaru!");
        // Reload rules
        const rulesRes = await fetch(`${API_BASE_URL}/api/rules`);
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      } else {
        triggerToast("Gagal update model.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    } finally {
      setIsRetraining(false);
    }
  };

  // Clear toast after timeout
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-indigo-600/30 selection:text-indigo-200">
      
      {/* Header and Branding */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-xl font-black text-white tracking-tight">
                  Supermart
                </h1>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  Fresh Grocery
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                Belanja Bahan Makanan Cerdas & Praktis
              </p>
            </div>
          </div>

          {/* Tab Button Selector */}
          <nav className="flex items-center bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 w-full sm:w-auto overflow-x-auto shadow-inner">
            <button
              id="tab-toko"
              onClick={() => setActiveTab("toko")}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "toko"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Store className="h-4 w-4" />
              Situs Toko
            </button>
            <button
              id="tab-keranjang"
              onClick={() => setActiveTab("keranjang")}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer relative whitespace-nowrap ${
                activeTab === "keranjang"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Keranjang
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] font-black h-5 w-5 flex items-center justify-center animate-bounce border-2 border-zinc-950 shadow-sm">
                  {totalCartCount}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            <button
              id="tab-rules"
              onClick={() => setActiveTab("rules")}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "rules"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Admin Panel
            </button>
          </nav>
        </div>
      </header>

      {/* Main Core View Area */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-grow">
        
        {/* Banner only visible in Admin Panel */}
        {activeTab === "rules" && (
          <div className="mb-6 bg-gradient-to-r from-indigo-950/40 via-zinc-900/80 to-zinc-950 p-6 rounded-2xl border border-indigo-500/30 flex items-start gap-4 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full filter blur-2xl" />
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                Dashboard Admin / Mesin Apriori
              </span>
              <h2 className="text-base md:text-lg font-black text-white mt-2 leading-tight">
                Sistem Pendeteksi Pola Kombinasi Belanja
              </h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-4xl leading-relaxed mb-4">
                Area ini digunakan untuk mengatur rekomendasi cerdas dari toko. Sistem memproses data riwayat transaksi kasir untuk menghasilkan <strong className="text-indigo-400">Aturan Asosiasi (Association Rules)</strong> baru yang akan ditampilkan ke pelanggan di Keranjang mereka.
              </p>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-950 text-emerald-400 border border-zinc-800 text-sm font-bold rounded-xl shadow-inner">
                  <CheckCircle2 className="h-4 w-4" />
                  {rules.length} Aturan Aktif di Database
                </div>
                <button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetraining ? "animate-spin" : ""}`} />
                  {isRetraining ? "Memproses Data..." : "Jalankan Algoritma Ulang"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab content renderer */}
        <div id="tab-content-panel">
          {activeTab === "toko" && (
            <ProductGrid products={products} onAddToCart={handleAddToCart} cartItemsCount={cartItemsCount} />
          )}

          {activeTab === "keranjang" && (
            <CartView
              cart={cart}
              products={products}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onAddToCart={handleAddToCart}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              rules={rules}
            />
          )}

          {activeTab === "rules" && <RulesTable rules={rules} />}
        </div>
      </main>

      {/* Clean Store Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 mt-12 text-center text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="font-bold text-zinc-300 text-base flex items-center gap-2">
              <Store className="h-4 w-4" /> Supermart
            </h3>
            <p className="text-xs mt-1">Belanja kebutuhan sehari-hari dengan mudah dan cepat.</p>
          </div>
          <div className="text-xs text-zinc-600 font-medium">
            © 2026 Supermart Inc. All rights reserved. (Tugas Akhir Data Mining)
          </div>
        </div>
      </footer>

      {/* Toast Alert Indicator */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-medium text-xs md:text-sm px-4 py-3 rounded-xl shadow-xl shadow-indigo-600/20 border border-indigo-400/30 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
