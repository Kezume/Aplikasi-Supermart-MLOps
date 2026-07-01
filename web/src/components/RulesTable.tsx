/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ArrowUpDown, HelpCircle, Search, Sparkles, SlidersHorizontal, BookOpen, AlertCircle } from "lucide-react";
import { AssociationRule } from "../data";

interface RulesTableProps {
  rules: AssociationRule[];
}

type SortField = "if_buy" | "recommend" | "support" | "confidence" | "lift";
type SortOrder = "asc" | "desc";

export default function RulesTable({ rules }: RulesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minLift, setMinLift] = useState(1.2);
  const [sortField, setSortField] = useState<SortField>("lift");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Summary Metrics of the Rules
  const stats = useMemo(() => {
    if (rules.length === 0) {
      return {
        totalCount: 0,
        avgLift: "0.00",
        avgConfidence: "0.0",
        maxLift: "0.00",
        strongRulesCount: 0,
      };
    }

    const totalCount = rules.length;
    const avgLift = rules.reduce((sum, r) => sum + r.lift, 0) / totalCount;
    const avgConfidence = rules.reduce((sum, r) => sum + r.confidence, 0) / totalCount;
    const maxLift = Math.max(...rules.map((r) => r.lift));
    const strongRulesCount = rules.filter((r) => r.lift > 2.5).length;

    return {
      totalCount,
      avgLift: avgLift.toFixed(2),
      avgConfidence: (avgConfidence * 100).toFixed(1),
      maxLift: maxLift.toFixed(2),
      strongRulesCount,
    };
  }, [rules]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedRules = useMemo(() => {
    if (rules.length === 0) return [];

    let result = rules.filter((rule) => {
      // Lift Filter
      if (rule.lift < minLift) return false;

      // Text Search Filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const condString = rule.if_buy.join(" ").toLowerCase();
        const recString = rule.recommend.join(" ").toLowerCase();
        return condString.includes(query) || recString.includes(query);
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Format arrays to comparable string representation
      if (Array.isArray(valA)) {
        valA = valA.join(", ");
      }
      if (Array.isArray(valB)) {
        valB = valB.join(", ");
      }

      if (valA < valB) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (valA > valB) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [searchTerm, minLift, sortField, sortOrder, rules]);

  const getLiftColorClass = (lift: number) => {
    if (lift > 2.5) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    }
    if (lift >= 2.0 && lift <= 2.5) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    }
    return "bg-indigo-500/10 text-indigo-300 border border-indigo-500/10";
  };

  return (
    <div className="space-y-6">
      {rules.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-400">Rules Belum Diunggah</h4>
            <p className="text-xs text-amber-500/80 mt-1">
              Silakan unggah file <code>rules_api.json</code> di bagian atas halaman untuk melihat tabel Association Rules.
            </p>
          </div>
        </div>
      )}
      {/* Association Mining Academic Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Aturan Asosiasi</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-white font-mono">{stats.totalCount}</span>
            <span className="text-xs text-zinc-500">rules</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Dataset: 30K Transaksi</p>
        </div>

        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Rata-rata Lift Ratio</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-indigo-400 font-mono">{stats.avgLift}x</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Pusat Asosiasi: Milk & Cereal</p>
        </div>

        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Rata-rata Confidence</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-purple-400 font-mono">{stats.avgConfidence}%</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Konfidentalitas Aturan</p>
        </div>

        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Lift Tertinggi & Kuat (&gt;2.5)</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-emerald-400 font-mono">{stats.maxLift}x</span>
            <span className="text-xs text-zinc-500">Max ({stats.strongRulesCount} rules)</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Hubungan Asosiatif Terkuat</p>
        </div>
      </div>

      {/* Control panel for searching and slider filter */}
      <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
          Filter & Navigasi Aturan Belanja
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-550" />
            <input
              id="rules-search"
              type="text"
              placeholder="Cari item di kondisi atau rekomendasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Lift Slider */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-400 block">Minimal Kekuatan Hubungan</span>
              <span className="text-[10px] text-zinc-500 block">Menyaring kekuatan asosiasi antar produk</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                id="lift-slider"
                type="range"
                min="1.2"
                max="2.7"
                step="0.1"
                value={minLift}
                onChange={(e) => setMinLift(parseFloat(e.target.value))}
                className="accent-indigo-500 w-full sm:w-32 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 min-w-[50px] text-center">
                {minLift.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules list tabular */}
      <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400 font-bold uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort("if_buy")}
                  className="px-6 py-4 cursor-pointer hover:bg-zinc-900/50 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Jika Beli Ini
                    <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("recommend")}
                  className="px-6 py-4 cursor-pointer hover:bg-zinc-900/50 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Maka Akan Beli Ini
                    <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("support")}
                  className="px-6 py-4 cursor-pointer hover:bg-zinc-900/50 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Frekuensi Terjadi
                    <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("confidence")}
                  className="px-6 py-4 cursor-pointer hover:bg-zinc-900/50 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Peluang Terbeli Bersama
                    <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lift")}
                  className="px-6 py-4 cursor-pointer hover:bg-zinc-900/50 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Kekuatan Hubungan
                    <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-default">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Aksi Bisnis
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {filteredAndSortedRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-550">
                    <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                    Tidak ada rule asosiasi yang lolos filter pencarian atau minimum Lift anda.
                  </td>
                </tr>
              ) : (
                filteredAndSortedRules.map((rule, index) => {
                  return (
                    <tr
                      key={index}
                      className="hover:bg-zinc-900/20 transition-colors group border-b border-zinc-800/40"
                    >
                      {/* Condition / Antecedent */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {rule.if_buy.map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-zinc-950 border border-zinc-855 text-zinc-300 rounded-md text-xs font-semibold"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Recommend / Consequent */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {rule.recommend.map((item, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-900/35 text-indigo-300 rounded-md text-xs font-bold"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Support */}
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-400">
                        {(rule.support * 100).toFixed(1)}%
                        <span className="text-[10px] text-zinc-550 block mt-0.5">
                          ({(rule.support * 30000).toLocaleString("id-ID")} Transaksi)
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-zinc-200">
                            {(rule.confidence * 100).toFixed(1)}%
                          </span>
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${rule.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Lift */}
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black font-mono ${getLiftColorClass(rule.lift)}`}>
                          {rule.lift.toFixed(2)}x
                        </span>
                      </td>

                      {/* Business Action Insight */}
                      <td className="px-6 py-4">
                        {(() => {
                          let actionText = "Buat Promo Silang";
                          let colorClass = "text-zinc-400 bg-zinc-800/50 border-zinc-700/50";

                          // Business Rules Implementation
                          if (rule.support >= 0.05) {
                            actionText = "Perbanyak Stok Produk";
                            colorClass = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                          } else if (rule.lift >= 2.5) {
                            actionText = "Buat Paket Bundling";
                            colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                          } else if (rule.lift >= 2.0) {
                            actionText = "Dekatkan Posisi Rak";
                            colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                          }

                          return (
                            <span className={`inline-block px-2.5 py-1.5 rounded-md text-[11px] font-bold border ${colorClass}`}>
                              {actionText}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Info Legend */}
        <div className="px-6 py-4 bg-zinc-950/40 border-t border-zinc-800 text-xs text-zinc-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Lift &gt; 2.50 (Sangat Kuat)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Lift 2.00 - 2.50 (Moderat)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" /> Lift &lt; 2.00 (Lemah)
            </span>
          </div>
          <span className="italic">
            Menampilkan {filteredAndSortedRules.length} dari {rules.length} Aturan Asosiasi aktif.
          </span>
        </div>
      </div>

      {/* Algorithm Explanations Panel */}
      <div className="bg-zinc-900/20 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          Panduan Membaca Angka untuk Pemilik Toko
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
          <div className="space-y-1.5 bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-850/60">
            <strong className="text-zinc-200">1. Frekuensi Terjadi (Support)</strong>
            <p className="leading-relaxed">
              Menunjukkan seberapa sering kedua produk ini muncul bersamaan dalam seluruh nota penjualan. Semakin besar angkanya, berarti kombinasi barang ini sangat populer dan paling sering dibeli oleh pelanggan.
            </p>
          </div>
          <div className="space-y-1.5 bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-850/60">
            <strong className="text-zinc-200">2. Peluang Terbeli Bersama (Confidence)</strong>
            <p className="leading-relaxed">
              Menunjukkan kepastian pelanggan membeli barang kedua setelah mereka mengambil barang pertama di keranjang. Jika peluangnya 80%, berarti dari 100 orang yang beli Roti, 80 orang di antaranya pasti juga mengambil Selai.
            </p>
          </div>
          <div className="space-y-1.5 bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-850/60">
            <strong className="text-zinc-200">3. Kekuatan Hubungan (Lift)</strong>
            <p className="leading-relaxed">
              Mengukur seberapa kuat dorongan barang pertama terhadap barang kedua. Jika nilainya lebih dari <code className="text-white">1.0x</code>, berarti barang pertama terbukti secara nyata mendongkrak penjualan barang kedua (bukan sekadar kebetulan/acak).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
