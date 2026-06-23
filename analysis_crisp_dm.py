# -*- coding: utf-8 -*-
# ==============================================================================
# ANALISIS ASSOCIATION RULE MINING MENGGUNAKAN METODE APRIORI
# Kerangka Kerja: CRISP-DM (Cross-Industry Standard Process for Data Mining)
# Paradigma: Unsupervised Learning
# ==============================================================================

# --- Import Library yang Diperlukan ---
import pandas as pd                     # Untuk manipulasi data tabular (DataFrame)
import numpy as np                      # Untuk komputasi numerik
import matplotlib.pyplot as plt         # Untuk pembuatan visualisasi/grafik
import seaborn as sns                   # Untuk visualisasi statistik yang lebih estetis
import networkx as nx                   # Untuk pembuatan network graph asosiasi
from collections import Counter         # Untuk menghitung frekuensi kemunculan item
from mlxtend.preprocessing import TransactionEncoder  # Untuk mengubah data menjadi format boolean
from mlxtend.frequent_patterns import apriori, association_rules  # Algoritma Apriori
import time                             # Untuk mengukur waktu eksekusi algoritma
import json                             # Untuk ekspor hasil ke format JSON (untuk API)
import os                               # Untuk operasi sistem file

# --- Persiapan Folder Output ---
# Membuat folder 'output' di direktori saat ini untuk menyimpan semua hasil analisis
os.makedirs('output', exist_ok=True)


# ==============================================================================
# FASE 1: BUSINESS UNDERSTANDING (Pemahaman Bisnis)
# Tujuan: Menemukan pola produk yang sering dibeli bersamaan (co-purchase)
# untuk mendukung sistem rekomendasi pada platform e-commerce toko bahan makanan.
# Target Metrik: Support ≥ 2%, Confidence ≥ 40%, Lift > 1.2
# ==============================================================================

print("=" * 60)
print("FASE 2: DATA UNDERSTANDING (Pemahaman Data)")
print("=" * 60)

# --- Memuat Dataset ---
import sqlite3
import sys

db_path = os.path.join(os.path.dirname(__file__), 'backend', 'database.sqlite')
conn = None

if os.path.exists(db_path):
    print(f"\n[INFO] Menghubungkan ke Database SQLite: {db_path}")
    conn = sqlite3.connect(db_path)
    # Mengambil transaksi, gabungkan nama produk berdasarkan transaction_id
    query = """
    SELECT transaction_id, GROUP_CONCAT(product_name, ',') as Products
    FROM transactions
    GROUP BY transaction_id
    """
    df_db = pd.read_sql_query(query, conn)
    
    # Jika transaksi di DB masih sedikit, gabungkan dengan data CSV asli agar Apriori tetap bekerja optimal
    print("[INFO] Memuat data history dari products.csv...")
    df_csv = pd.read_csv('products.csv')
    
    if len(df_db) > 0:
        print(f"[INFO] Menambahkan {len(df_db)} transaksi baru dari keranjang (Database)")
        df = pd.concat([df_csv, df_db], ignore_index=True)
    else:
        df = df_csv
else:
    print("\n[INFO] Database SQLite tidak ditemukan. Menggunakan products.csv murni.")
    df = pd.read_csv('products.csv')

# Menampilkan 10 baris pertama untuk memahami struktur data mentah
print("\n[INFO] 10 Baris Pertama Data:")
print(df.head(10))

# Menampilkan dimensi (jumlah baris & kolom) dari dataset
print(f"\n[INFO] Dimensi data: {df.shape[0]} baris, {df.shape[1]} kolom")

# --- Pengecekan Kualitas Data ---
# Memeriksa apakah terdapat nilai kosong (missing values) di setiap kolom
print("\n[INFO] Pengecekan Missing Values per Kolom:")
print(df.isnull().sum())

# Memeriksa apakah terdapat baris yang terduplikasi secara keseluruhan
print(f"[INFO] Jumlah Baris Duplikat: {df.duplicated().sum()}")

# --- Eksplorasi Produk Unik ---
# Memecah kolom 'Products' (yang berisi string "A, B, C") menjadi list per baris
# kemudian menghapus spasi di awal/akhir setiap nama produk
all_products_raw = df['Products'].dropna().apply(
    lambda x: [item.strip() for item in x.split(',')]
)

# Mengumpulkan semua nama produk ke dalam satu set untuk mendapatkan item unik
unique_products = set(item for sublist in all_products_raw for item in sublist)
print(f"\n[INFO] Jumlah Produk Unik yang Tersedia: {len(unique_products)}")

# --- Analisis Frekuensi Produk (Top 20) ---
# Menghitung berapa kali setiap produk muncul di seluruh transaksi
product_counts = Counter(item for sublist in all_products_raw for item in sublist)
top_20 = product_counts.most_common(20)
top_20_df = pd.DataFrame(top_20, columns=['Produk', 'Frekuensi'])
print("\n[INFO] Top 20 Produk Paling Sering Dibeli:")
print(top_20_df)

# --- Visualisasi 1: Bar Chart Top 20 Produk ---
# Membuat grafik batang horizontal untuk menampilkan 20 produk terlaris
plt.figure(figsize=(10, 8))
sns.barplot(x='Frekuensi', y='Produk', data=top_20_df, palette='viridis')
plt.title('Top 20 Produk Paling Sering Muncul dalam Transaksi')
plt.xlabel('Jumlah Kemunculan')
plt.ylabel('Nama Produk')
plt.tight_layout()
plt.savefig('output/top_20_products.png')
plt.close()
print("[OUTPUT] Grafik Top 20 Produk disimpan.")

# --- Statistik Deskriptif Isi Keranjang Belanja ---
# Menghitung jumlah item dalam setiap transaksi untuk memahami kebiasaan belanja
item_counts = all_products_raw.apply(len)
print("\n[INFO] Statistik Jumlah Item per Satu Transaksi:")
print(f"  Rata-rata  : {item_counts.mean():.2f} item")
print(f"  Minimum    : {item_counts.min()} item")
print(f"  Maksimum   : {item_counts.max()} item")
print(f"  Median     : {item_counts.median()} item")

# --- Visualisasi 2: Histogram Distribusi Item per Transaksi ---
# Menampilkan sebaran jumlah item yang dibeli dalam satu kali belanja
plt.figure(figsize=(8, 5))
sns.histplot(item_counts, bins=15, kde=False, color='skyblue')
plt.title('Distribusi Jumlah Item per Transaksi')
plt.xlabel('Jumlah Item dalam 1 Transaksi')
plt.ylabel('Jumlah Transaksi')
plt.tight_layout()
plt.savefig('output/histogram_items.png')
plt.close()
print("[OUTPUT] Histogram distribusi item disimpan.")

# --- Visualisasi 3: Heatmap Co-Occurrence ---
# Matriks co-occurrence menunjukkan seberapa sering dua produk dibeli BERSAMAAN
# Diambil 15 produk teratas untuk visualisasi yang lebih jelas
top_15_names = [p[0] for p in top_20[:15]]
co_matrix = pd.DataFrame(0, index=top_15_names, columns=top_15_names)

# Iterasi setiap transaksi dan hitung kemunculan pasangan produk
for items in all_products_raw:
    items_set = set(items)
    for p1 in top_15_names:
        if p1 in items_set:
            for p2 in top_15_names:
                if p2 in items_set:
                    co_matrix.loc[p1, p2] += 1

plt.figure(figsize=(12, 10))
sns.heatmap(co_matrix, annot=True, fmt='d', cmap='YlGnBu')
plt.title('Heatmap Co-Occurrence (Frekuensi Beli Bersamaan) Top 15 Produk')
plt.tight_layout()
plt.savefig('output/heatmap_cooccurrence.png')
plt.close()
print("[OUTPUT] Heatmap Co-occurrence disimpan.")


# ==============================================================================
# FASE 3: DATA PREPARATION (Persiapan & Pembersihan Data)
# Tujuan: Mengubah data mentah menjadi format yang dapat diproses oleh Apriori
# ==============================================================================

print("\n" + "=" * 60)
print("FASE 3: DATA PREPARATION (Persiapan Data)")
print("=" * 60)

# --- Langkah 3.1: Pembersihan & Standarisasi Teks ---
# Memproses setiap baris transaksi:
# - Membuang spasi berlebih (strip)
# - Mengubah ke format Title Case (huruf kapital di awal setiap kata)
#   Tujuan: agar "ice cream", " Ice Cream ", "ICE CREAM" dianggap produk yang SAMA
cleaned_transactions = []
for items_str in df['Products'].dropna():
    items = [item.strip().title() for item in items_str.split(',')]
    
    # --- Langkah 3.2: Filter Transaksi Tunggal (Noise Removal) ---
    # Hanya menyimpan transaksi yang berisi LEBIH DARI 1 item.
    # Alasan: Association Rule membutuhkan minimal 2 item untuk membentuk aturan asosiasi.
    # Transaksi 1 item tidak memiliki pasangan, sehingga merupakan data noise.
    if len(items) > 1:
        cleaned_transactions.append(items)

trans_before = len(df)
trans_after = len(cleaned_transactions)
print(f"\n[INFO] Jumlah transaksi sebelum filter : {trans_before}")
print(f"[INFO] Jumlah transaksi setelah filter (>1 item) : {trans_after}")
print(f"[INFO] Transaksi yang dibuang (noise)  : {trans_before - trans_after}")

# --- Langkah 3.3: Ekspor Data yang Sudah Dibersihkan ---
# Menyimpan transaksi bersih ke CSV sebagai dokumentasi hasil proses data cleaning
cleaned_df = pd.DataFrame({'Cleaned_Products': [', '.join(t) for t in cleaned_transactions]})
cleaned_df.to_csv('output/cleaned_transactions.csv', index=False)
print(f"[OUTPUT] Data bersih disimpan: {trans_after} transaksi valid.")

# --- Langkah 3.4: Transformasi ke Matriks Boolean (One-Hot Encoding) ---
# TransactionEncoder mengubah data list menjadi matriks True/False (1/0):
# - Baris = setiap transaksi
# - Kolom = setiap produk unik
# - Nilai True  = produk tersebut ADA dalam transaksi
# - Nilai False = produk tersebut TIDAK ADA dalam transaksi
# Format ini diperlukan agar algoritma Apriori dapat menghitung nilai Support
te = TransactionEncoder()
te_ary = te.fit(cleaned_transactions).transform(cleaned_transactions)
df_encoded = pd.DataFrame(te_ary, columns=te.columns_)

print(f"\n[INFO] Dimensi matriks hasil encoding: {df_encoded.shape}")
print("[INFO] Cuplikan 5 baris pertama matriks (True/False):")
print(df_encoded.head())


# ==============================================================================
# FASE 4: MODELING (Pemodelan dengan Algoritma Apriori)
# Metode: Apriori Algorithm
# Parameter: min_support = 0.01 (1%), min_confidence = 0.3 (30%)
# Penjelasan Apriori:
#   - Algoritma Apriori bekerja dengan prinsip "Apriori Property":
#     Jika suatu itemset sering muncul (frequent), maka setiap subset-nya juga sering.
#   - Algoritma ini men-scan database secara berulang untuk menemukan semua
#     itemset yang memenuhi batas minimum support, lalu menghasilkan aturan asosiasi.
# ==============================================================================

print("\n" + "=" * 60)
print("FASE 4: MODELING - ALGORITMA APRIORI")
print("=" * 60)

# --- Langkah 4.1: Menemukan Frequent Itemsets dengan Apriori ---
# min_support = 0.01 artinya: sebuah kombinasi produk harus muncul di
# minimal 1% dari seluruh transaksi (= 300 dari 30.000 transaksi)
# use_colnames = True agar output menggunakan nama produk (bukan indeks angka)
# max_len = 4 membatasi pencarian hingga kombinasi 4 produk (untuk efisiensi)
print("\n[PROSES] Menjalankan algoritma Apriori untuk menemukan frequent itemsets...")
waktu_mulai = time.time()

freq_apriori = apriori(
    df_encoded,
    min_support=0.01,
    use_colnames=True,
    max_len=4
)

waktu_selesai = time.time()
waktu_eksekusi = waktu_selesai - waktu_mulai

print(f"[INFO] Waktu eksekusi Apriori      : {waktu_eksekusi:.4f} detik")
print(f"[INFO] Jumlah frequent itemsets ditemukan: {len(freq_apriori)}")

# Menambahkan kolom 'length' untuk mengetahui panjang setiap itemset
freq_apriori['length'] = freq_apriori['itemsets'].apply(len)

# Menampilkan distribusi panjang itemset (berapa banyak yang berisi 1, 2, 3, atau 4 item)
distribusi_panjang = freq_apriori['length'].value_counts().sort_index()
print("\n[INFO] Distribusi panjang Frequent Itemsets:")
for panjang, jumlah in distribusi_panjang.items():
    print(f"  {panjang}-itemset: {jumlah} kombinasi")

# --- Visualisasi 4: Distribusi Panjang Itemset ---
plt.figure(figsize=(6, 4))
sns.barplot(x=distribusi_panjang.index, y=distribusi_panjang.values, palette='magma')
plt.title('Distribusi Panjang Frequent Itemsets (Apriori)')
plt.xlabel('Jumlah Item dalam Kombinasi')
plt.ylabel('Jumlah Frequent Itemsets')
plt.tight_layout()
plt.savefig('output/itemset_length.png')
plt.close()
print("[OUTPUT] Grafik distribusi panjang itemset disimpan.")

# Menampilkan 20 frequent itemsets dengan nilai support tertinggi
print("\n[INFO] Top 20 Frequent Itemsets (diurutkan berdasarkan Support tertinggi):")
print(freq_apriori.sort_values('support', ascending=False).head(20)[['support', 'itemsets']])

# --- Langkah 4.2: Menghasilkan Association Rules ---
# Dari frequent itemsets, kita hasilkan aturan asosiasi dengan batas:
# metric="confidence" dan min_threshold=0.3 artinya:
# Hanya aturan dengan nilai Confidence >= 30% yang akan disimpan
print("\n[PROSES] Menghasilkan association rules dari frequent itemsets...")
rules_apriori = association_rules(
    freq_apriori,
    metric="confidence",
    min_threshold=0.3
)

print(f"[INFO] Jumlah association rules yang dihasilkan: {len(rules_apriori)}")

# Menampilkan 20 aturan terbaik berdasarkan nilai Lift tertinggi
print("\n[INFO] Top 20 Association Rules terbaik (diurutkan berdasarkan Lift):")
top_rules_display = rules_apriori.sort_values('lift', ascending=False).head(20)
print(top_rules_display[['antecedents', 'consequents', 'support', 'confidence', 'lift']])

# --- Langkah 4.3: Filter Rules Terbaik untuk Deployment ---
# Memfilter lebih ketat untuk mendapatkan aturan yang benar-benar bermakna:
# - Support >= 2%   : Kombinasi harus cukup sering terjadi (tidak langka)
# - Confidence >= 40%: Tingkat keyakinan rekomendasinya tinggi
# - Lift > 1.2     : Hubungan antar produk bukan kebetulan (positif correlation)
# Catatan: filter dilonggarkan (support >= 0.01) agar lebih banyak rules yang
# tersimpan sebagai bahan rekomendasi. Nilai ini masih valid karena berarti
# setiap pola muncul minimal 1% dari 30.000 transaksi = 300 kali transaksi.
rules_final = rules_apriori[
    (rules_apriori['support']    >= 0.01) &
    (rules_apriori['confidence'] >= 0.3)  &
    (rules_apriori['lift']       >  1.2)
].copy()

print(f"\n[INFO] Jumlah rules setelah filter (siap deploy): {len(rules_final)}")


# ==============================================================================
# FASE 5: EVALUATION (Evaluasi Hasil)
# Tujuan: Memvisualisasikan dan mengevaluasi kualitas rules yang dihasilkan
# ==============================================================================

print("\n" + "=" * 60)
print("FASE 5: EVALUATION (Evaluasi Hasil)")
print("=" * 60)

# --- Statistik Ringkasan Rules ---
print("\n[INFO] Statistik Deskriptif Association Rules Final:")
print(f"  Rata-rata Support    : {rules_final['support'].mean():.4f}")
print(f"  Rata-rata Confidence : {rules_final['confidence'].mean():.4f}")
print(f"  Rata-rata Lift       : {rules_final['lift'].mean():.4f}")
print(f"  Lift Tertinggi       : {rules_final['lift'].max():.4f}")
print(f"  Confidence Tertinggi : {rules_final['confidence'].max():.4f}")

# Menampilkan aturan dengan Lift tertinggi (aturan terkuat/paling tidak kebetulan)
print("\n[INFO] Aturan Asosiasi dengan Lift Tertinggi:")
best_rule = rules_final.sort_values('lift', ascending=False).head(1)
print(best_rule[['antecedents', 'consequents', 'support', 'confidence', 'lift', 'conviction']])

# --- Visualisasi 5: Scatter Plot Support vs Confidence (diwarnai Lift) ---
# Plot ini memperlihatkan distribusi kualitas semua rules sekaligus:
# - Sumbu X = Support (seberapa umum aturan ini terjadi)
# - Sumbu Y = Confidence (seberapa yakin rekomendasinya)
# - Warna   = Lift (merah = lift tinggi = asosiasi lebih kuat)
# - Ukuran  = panjang antecedent + consequent
plt.figure(figsize=(10, 7))
sizes = (rules_final['antecedents'].apply(len) + rules_final['consequents'].apply(len)) * 60
scatter = plt.scatter(
    rules_final['support'],
    rules_final['confidence'],
    c=rules_final['lift'],
    s=sizes,
    cmap='RdYlGn',
    alpha=0.7,
    edgecolors='gray',
    linewidth=0.5
)
plt.colorbar(scatter, label='Nilai Lift')
plt.title('Scatter Plot: Support vs Confidence\n(Warna = Lift, Ukuran = Panjang Aturan)')
plt.xlabel('Support')
plt.ylabel('Confidence')
plt.grid(True, linestyle='--', alpha=0.4)
plt.tight_layout()
plt.savefig('output/scatter_rules.png')
plt.close()
print("[OUTPUT] Scatter plot support vs confidence disimpan.")

# --- Visualisasi 6: Bar Chart Top 15 Rules by Lift ---
# Menampilkan 15 aturan asosiasi terkuat dalam format "JIKA X -> MAKA Y"
top_15_rules = rules_final.sort_values('lift', ascending=False).head(15)
top_15_labels = top_15_rules.apply(
    lambda r: f"{', '.join(list(r['antecedents']))} -> {', '.join(list(r['consequents']))}",
    axis=1
)

plt.figure(figsize=(12, 7))
sns.barplot(x=top_15_rules['lift'].values, y=top_15_labels.values, palette='coolwarm')
plt.title('Top 15 Association Rules Terkuat (berdasarkan Nilai Lift)')
plt.xlabel('Nilai Lift')
plt.ylabel('Aturan Asosiasi (Antecedent → Consequent)')
plt.tight_layout()
plt.savefig('output/bar_top15_rules.png')
plt.close()
print("[OUTPUT] Bar chart top 15 rules disimpan.")

# --- Visualisasi 7: Network Graph Asosiasi Antar Produk ---
# Grafik jaringan ini menggambarkan hubungan antar produk secara visual:
# - Simpul (node) = nama produk
# - Anak panah (edge) = aturan asosiasi (dari antecedent ke consequent)
# - Ketebalan garis = kekuatan asosiasi (nilai Lift)
G = nx.DiGraph()
top_30_rules = rules_final.sort_values('lift', ascending=False).head(30)

for _, r in top_30_rules.iterrows():
    sumber = ', '.join(list(r['antecedents']))
    tujuan = ', '.join(list(r['consequents']))
    G.add_edge(sumber, tujuan, weight=r['lift'])

plt.figure(figsize=(14, 11))
pos = nx.spring_layout(G, k=0.6, seed=42)
edges = G.edges()
weights = [G[u][v]['weight'] for u, v in edges]

nx.draw_networkx_nodes(G, pos, node_size=1800, node_color='lightblue', alpha=0.9)
nx.draw_networkx_edges(G, pos, edgelist=edges, width=[w * 0.8 for w in weights],
                       edge_color='steelblue', alpha=0.6, arrows=True, arrowsize=20)
nx.draw_networkx_labels(G, pos, font_size=8, font_weight='bold')
plt.title('Network Graph: Hubungan Asosiasi Antar Produk (Top 30 Rules)')
plt.axis('off')
plt.tight_layout()
plt.savefig('output/network_rules.png', dpi=150)
plt.close()
print("[OUTPUT] Network graph asosiasi disimpan.")


# ==============================================================================
# FASE 6: DEPLOYMENT (Penyebaran Hasil ke Sistem E-Commerce)
# Tujuan: Mengekspor rules ke format yang dapat dikonsumsi oleh Backend API
# ==============================================================================

print("\n" + "=" * 60)
print("FASE 6: DEPLOYMENT (Ekspor Hasil)")
print("=" * 60)

# --- Langkah 6.1: Ekspor ke CSV ---
# Mengubah format frozenset (antecedents/consequents) menjadi string biasa
# agar mudah dibaca oleh manusia maupun program lain
rules_export = rules_final[
    ['antecedents', 'consequents', 'support', 'confidence', 'lift', 'leverage', 'conviction']
].copy()
rules_export['antecedents'] = rules_export['antecedents'].apply(lambda x: ', '.join(list(x)))
rules_export['consequents'] = rules_export['consequents'].apply(lambda x: ', '.join(list(x)))

rules_export.to_csv('output/rules_output.csv', index=False)
print(f"[OUTPUT] Rules diekspor ke CSV: {len(rules_export)} aturan.")

# --- Langkah 6.2: Ekspor ke JSON dan SQLite ---
# Mengubah rules ke format JSON agar mudah dibaca oleh program lain
# Format: { "if_buy": [...], "recommend": [...], "confidence": ..., "lift": ..., "support": ... }
rules_json = []
for _, row in rules_final.iterrows():
    rules_json.append({
        "if_buy":     list(row['antecedents']),  # Produk yang ada di keranjang (kondisi)
        "recommend":  list(row['consequents']),  # Produk yang direkomendasikan (hasil)
        "confidence": round(float(row['confidence']), 4),  # Tingkat keyakinan rekomendasi
        "lift":       round(float(row['lift']),       4),  # Kekuatan asosiasi (bukan kebetulan)
        "support":    round(float(row['support']),    4)   # Frekuensi kemunculan pola ini
    })

with open('output/rules_api.json', 'w') as f:
    json.dump(rules_json, f, indent=2, ensure_ascii=False)

print(f"[OUTPUT] Rules diekspor ke JSON: {len(rules_json)} aturan.")

if conn:
    try:
        print("\n[INFO] Menyimpan rules terbaru ke tabel 'rules' di Database SQLite...")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM rules") # Kosongkan rules lama
        for r in rules_json:
            if_buy_str = ','.join(r['if_buy'])
            rec_str = ','.join(r['recommend'])
            cursor.execute('''
                INSERT INTO rules (if_buy, recommend, support, confidence, lift)
                VALUES (?, ?, ?, ?, ?)
            ''', (if_buy_str, rec_str, r['support'], r['confidence'], r['lift']))
        conn.commit()
        print("[OUTPUT] Rules berhasil di-update ke Database SQLite secara otomatis!")
    except Exception as e:
        print(f"[ERROR] Gagal menyimpan ke SQLite: {e}")
    finally:
        conn.close()


# ==============================================================================
# DEMO: UJI COBA FUNGSI REKOMENDASI
# Mensimulasikan cara kerja mesin rekomendasi ketika pelanggan
# memasukkan produk tertentu ke dalam keranjang belanja mereka
# ==============================================================================

print("\n" + "=" * 60)
print("DEMO: UJI COBA SISTEM REKOMENDASI")
print("=" * 60)

def get_recommendations(cart_items: list, rules_df, top_n: int = 5) -> list:
    """
    Fungsi untuk menghasilkan rekomendasi produk berdasarkan isi keranjang.
    
    Parameter:
    - cart_items : List nama produk yang sudah ada di keranjang pelanggan
    - rules_df   : DataFrame berisi association rules hasil Apriori
    - top_n      : Jumlah maksimum rekomendasi yang dikembalikan
    
    Cara Kerja:
    1. Ubah isi keranjang menjadi set untuk perbandingan yang efisien
    2. Cari semua rules yang kondisi (antecedents) ada di dalam keranjang
    3. Kumpulkan produk rekomendasi (consequents) yang belum ada di keranjang
    4. Urutkan berdasarkan Confidence dan Lift tertinggi
    5. Kembalikan top_n rekomendasi terbaik
    """
    recommendations = {}
    cart_set = set(cart_items)  # Konversi ke set untuk pengecekan O(1)

    for _, rule in rules_df.iterrows():
        antecedents = set(rule['antecedents'])

        # Periksa apakah semua produk dalam kondisi (antecedent) ada di keranjang
        if antecedents.issubset(cart_set):
            for item in rule['consequents']:
                # Hanya rekomendasikan produk yang BELUM ada di keranjang
                if item not in cart_set:
                    if item not in recommendations:
                        # Simpan rekomendasi baru dengan metrik evaluasinya
                        recommendations[item] = {
                            'product':    item,
                            'confidence': float(rule['confidence']),
                            'lift':       float(rule['lift']),
                            'support':    float(rule['support'])
                        }
                    else:
                        # Jika produk sudah ada, simpan hanya jika confidence-nya lebih tinggi
                        if rule['confidence'] > recommendations[item]['confidence']:
                            recommendations[item]['confidence'] = float(rule['confidence'])
                            recommendations[item]['lift']       = float(rule['lift'])

    # Urutkan rekomendasi berdasarkan Confidence (primer) dan Lift (sekunder)
    sorted_recs = sorted(
        recommendations.values(),
        key=lambda x: (x['confidence'], x['lift']),
        reverse=True
    )

    return sorted_recs[:top_n]


# Uji coba 1: Keranjang berisi Cereal
test_cart_1 = ['Cereal']
hasil_1 = get_recommendations(test_cart_1, rules_final, top_n=5)
print(f"\n[TEST 1] Keranjang: {test_cart_1}")
print("  Rekomendasi produk:")
for r in hasil_1:
    print(f"    -> {r['product']:20s} | Confidence: {r['confidence']:.1%} | Lift: {r['lift']:.2f}x")

# Uji coba 2: Keranjang berisi beberapa produk
test_cart_2 = ['Milk', 'Bread']
hasil_2 = get_recommendations(test_cart_2, rules_final, top_n=5)
print(f"\n[TEST 2] Keranjang: {test_cart_2}")
print("  Rekomendasi produk:")
for r in hasil_2:
    print(f"    -> {r['product']:20s} | Confidence: {r['confidence']:.1%} | Lift: {r['lift']:.2f}x")

print("\n" + "=" * 60)
print("PROSES DATA MINING SELESAI")
print(f"Total Rules Final  : {len(rules_final)} aturan asosiasi")
print(f"Metode             : Apriori")
print(f"Paradigma          : Unsupervised Learning")
print(f"Output disimpan di : output/")
print("=" * 60)
