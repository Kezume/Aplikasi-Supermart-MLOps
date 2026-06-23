/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, AssociationRule } from "../data";
import ProductIcon from "./ProductIcon";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartViewProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (productName: string, delta: number) => void;
  onRemoveItem: (productName: string) => void;
  onAddToCart: (product: Product) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  rules: AssociationRule[];
}

interface ActiveRecommendation {
  recommendedProduct: Product;
  confidence: number;
  rule: AssociationRule;
}

export default function CartView({
  cart,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onAddToCart,
  onClearCart,
  onCheckout,
  rules,
}: CartViewProps) {
  const cartNames = useMemo(() => cart.map((item) => item.product.name), [cart]);

  // Compute recommendation based on current cart items
  const recommendations = useMemo(() => {
    if (cart.length === 0 || rules.length === 0) return [];

    const matchedRecsMap: { [productName: string]: { maxConfidence: number; bestRule: AssociationRule } } = {};

    rules.forEach((rule) => {
      // Check if rule.if_buy is a subset of the currently bought products
      const isSubset = rule.if_buy.every((item) => cartNames.includes(item));

      if (isSubset) {
        rule.recommend.forEach((recName) => {
          // Rule should recommend an item not already in the cart
          if (!cartNames.includes(recName)) {
            const confidence = rule.confidence;
            if (!matchedRecsMap[recName] || confidence > matchedRecsMap[recName].maxConfidence) {
              matchedRecsMap[recName] = {
                maxConfidence: confidence,
                bestRule: rule,
              };
            }
          }
        });
      }
    });

    const activeRecommendations: ActiveRecommendation[] = [];

    Object.entries(matchedRecsMap).forEach(([prodName, data]) => {
      const prodObj = products.find((p) => p.name === prodName);
      if (prodObj) {
        activeRecommendations.push({
          recommendedProduct: prodObj,
          confidence: data.maxConfidence,
          rule: data.bestRule,
        });
      }
    });

    // Sort by confidence descending
    return activeRecommendations.sort((a, b) => b.confidence - a.confidence);
  }, [cartNames, rules, products]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Keranjang Belanja Section */}
      <div className="lg:col-span-7 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 md:p-6 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            Keranjang Belanja
          </h2>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="h-16 w-16 bg-zinc-950/80 rounded-full flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Keranjang Anda masih kosong</p>
              <p className="text-zinc-500 text-sm mt-1">
                Tambahkan beberapa produk dari Katalog Belanja untuk mengaktifkan mesin rekomendasi Apriori.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  id={`cart-item-${item.product.id}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="py-4 flex items-center justify-between gap-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-800">
                      <ProductIcon name={item.product.name} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-400">
                        {formatPrice(item.product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                      <button
                        onClick={() => onUpdateQuantity(item.product.name, -1)}
                        className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.name, 1)}
                        className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="text-right min-w-[70px] sm:min-w-[90px]">
                      <p className="text-xs sm:text-sm font-bold font-mono text-white">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.name)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-950 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Total Ringkasan */}
            <div className="pt-6 mt-2 space-y-4">
              <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Belanja</span>
                <span className="text-lg md:text-xl font-black font-mono text-indigo-400">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                id="btn-checkout"
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Checkout Transaksi <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rekomendasi Produk Section */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="bg-gradient-to-b from-indigo-950/20 to-indigo-900/5 rounded-2xl border border-indigo-500/20 p-5 md:p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-indigo-500/20">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold text-white">Sering Dibeli Bersamaan</h2>
              <p className="text-xs text-indigo-300">Rekomendasi khusus berdasarkan keranjang Anda</p>
            </div>
          </div>

          {rules.length === 0 ? (
            <div className="py-8 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
              <TrendingUp className="h-8 w-8 text-zinc-650 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 px-4">
                Tidak ada rekomendasi saat ini. (Hubungi Admin Toko)
              </p>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-8 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
              <TrendingUp className="h-8 w-8 text-zinc-650 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 px-4">
                Keranjang masih kosong. Tambahkan beberapa bahan makanan ke keranjang untuk memicu rekomendasi.
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-8 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800 px-4 space-y-2">
              <HelpCircle className="h-8 w-8 text-zinc-650 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">Tidak ada rekomendasi aktif</p>
              <p className="text-[11px] text-zinc-500">
                Tambahkan lebih banyak produk ke keranjang Anda untuk mendapatkan rekomendasi pintar tambahan!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Ditemukan <span className="font-bold text-indigo-400 font-mono">{recommendations.length} rekomendasi</span> berdasarkan produk di keranjang anda, diurutkan dari Confidence tertinggi:
              </p>

              <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {recommendations.slice(0, 5).map(({ recommendedProduct, confidence, rule }) => (
                    <motion.div
                      key={recommendedProduct.id}
                      id={`recommendation-card-${recommendedProduct.id}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-zinc-950 border border-zinc-800/80 hover:border-indigo-500/40 rounded-xl p-3.5 hover:bg-zinc-900/60 transition-all duration-300 flex flex-col justify-between gap-3 relative overflow-hidden group shadow-lg"
                    >
                      {/* Glow design decoration */}
                      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none rounded-bl-full" />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-lg bg-indigo-950/50 flex items-center justify-center text-indigo-400 border border-indigo-900/20 group-hover:scale-110 duration-200 transition-transform">
                            <ProductIcon name={recommendedProduct.name} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {recommendedProduct.name}
                            </h4>
                            <p className="text-xs font-mono text-zinc-400 mt-0.5">
                              {formatPrice(recommendedProduct.price)}
                            </p>
                          </div>
                        </div>

                        {/* Confidence Indicator Badge */}
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner font-mono">
                            {(confidence * 100).toFixed(1)}% Conf
                          </span>
                        </div>
                      </div>

                      {/* Rule Explanation */}
                      <div className="bg-zinc-900/80 rounded-lg p-2 border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded text-indigo-400 font-medium">Kondisi</span>
                          <span className="text-zinc-300 font-semibold">{rule.if_buy.join(" + ")}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-zinc-550" />
                          <span className="text-indigo-300 font-bold">{recommendedProduct.name}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
                          <span>Lift: <strong className="text-amber-400">{rule.lift.toFixed(2)}x</strong></span>
                          <span>Support: <strong className="text-indigo-400">{(rule.support * 100).toFixed(1)}%</strong></span>
                        </div>
                      </div>

                      {/* Add directly to cart */}
                      <button
                        id={`btn-add-rec-${recommendedProduct.id}`}
                        onClick={() => onAddToCart(recommendedProduct)}
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 hover:border-indigo-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add item
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {recommendations.length > 5 && (
                <p className="text-[10px] text-center text-zinc-500 italic mt-1 bg-zinc-950 p-1.5 rounded-md">
                  + {recommendations.length - 5} rekomendasi lainnya tersedia. Sesuaikan keranjang Anda untuk mengubah prioritas pola.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
