/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, ShoppingCart, Tag, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../data";
import ProductIcon from "./ProductIcon";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cartItemsCount: { [key: string]: number };
}

export default function ProductGrid({ products, onAddToCart, cartItemsCount }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const categories = useMemo(() => {
    const list = new Set(products.map((p) => p.category));
    return ["Semua", ...Array.from(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Search & Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Katalog Belanja Bahan Makanan
          </h2>
          <p className="text-sm text-zinc-400">
            Pilih dari puluhan produk segar & berkualitas. Nikmati pengalaman belanja yang praktis dan menyenangkan.
          </p>
        </div>

        {/* Real-time search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Cari produk atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none">
        {categories.map((category) => (
          <button
            key={category}
            id={`category-btn-${category.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategory === category
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/30"
                : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60 hover:bg-zinc-850"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-800">
          <Tag className="h-10 w-10 text-zinc-650 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Produk tidak ditemukan</p>
          <p className="text-zinc-500 text-sm mt-1">Coba gunakan kata kunci pencarian atau kategori lain.</p>
        </div>
      ) : (
        <motion.div
          id="product-grid-container"
          layout
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const qtyInCart = cartItemsCount[product.name] || 0;
              return (
                <motion.div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex flex-col justify-between bg-zinc-900/40 rounded-2xl border border-zinc-850/80 p-4 hover:bg-zinc-900/80 hover:border-indigo-500/40 transition-all duration-300"
                >
                  <div>
                    {/* Badge & Category */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold bg-zinc-950/80 text-indigo-300 px-2.5 py-1 rounded-md border border-zinc-850">
                        {product.category}
                      </span>
                      {product.isBestSeller && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-550/10 text-amber-500 px-2 py-1 rounded-md border border-amber-500/20 shadow-sm shadow-amber-500/5">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          Terlaris #{product.rank}
                        </span>
                      )}
                    </div>

                    <div className="relative flex items-center justify-center h-24 mb-4 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900/60 group-hover:from-indigo-950/20 group-hover:to-zinc-950 transition-colors border border-zinc-950 group-hover:border-indigo-500/20 overflow-hidden text-zinc-400 group-hover:text-indigo-400">
                      {qtyInCart > 0 && (
                        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-mono text-[11px] font-bold shadow-md shadow-indigo-500/30">
                          {qtyInCart}
                        </div>
                      )}
                      <div className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-300">
                        <ProductIcon name={product.name} className="h-10 w-10" />
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <p className="text-xs font-mono text-zinc-400 mt-1 font-semibold">
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  {/* Add action */}
                  <div className="mt-4 pt-2 border-t border-zinc-950">
                    <button
                      id={`btn-add-to-cart-${product.id}`}
                      onClick={() => onAddToCart(product)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-950 text-zinc-200 group-hover:bg-indigo-600 group-hover:text-white hover:brightness-110 font-medium text-xs border border-zinc-800 group-hover:border-indigo-500/40 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {qtyInCart > 0 ? "Tambah Lagi" : "Masuk Keranjang"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
