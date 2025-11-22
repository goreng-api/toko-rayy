// index.js - Server Backend Node.js dengan Express.js

// Impor modul yang diperlukan
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import formidable from 'formidable'; // Diperlukan untuk parsing form data (file upload)
import fs from 'fs';
import uploadImage from 'node-upload-images'; // Library untuk upload gambar ke hosting gratis

// Dapatkan __dirname untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// --- MENYAJIKAN FILE STATIS ---
app.use(express.static(__dirname));

// --- RUTE API UNTUK LOGIN ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === 'password-rahasia-anda-kuat') {
        res.status(200).json({ message: 'Login berhasil!' });
    } else {
        res.status(401).json({ message: 'Password salah.' });
    }
});

// --- RUTE API UNTUK MENAMBAH PRODUK ---
app.post('/api/addProduct', (req, res) => {
    const productData = req.body;
    console.log('Menerima data produk baru:', productData);
    res.status(200).json({ message: `Produk "${productData.nama}" berhasil ditambahkan.` });
});

// --- [BARU] RUTE API UNTUK SUBMIT ORDER & UPLOAD GAMBAR ---
app.post('/api/submitOrder', (req, res) => {
    const form = formidable({ 
        multiples: false,
        keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ message: 'Gagal memproses formulir.' });
        }

        try {
            // Ambil file bukti transfer
            const buktiFile = files.buktiTf;
            if (!buktiFile) {
                return res.status(400).json({ message: 'Bukti pembayaran wajib diupload.' });
            }

            const filePath = Array.isArray(buktiFile) ? buktiFile[0].filepath : buktiFile.filepath;

            // Upload gambar ke hosting gratis menggunakan node-upload-images
            // Ini akan mencoba upload ke 4 provider berbeda (imgbb, dll) dan mengambil linknya
            const uploaded = await uploadImage(filePath);
            
            // Kita ambil link pertama yang berhasil
            const imageLink = uploaded.length > 0 ? uploaded[0] : null;

            if (!imageLink) {
                throw new Error("Gagal mendapatkan link gambar.");
            }

            // Hapus file temporary setelah diupload (opsional, untuk kebersihan server)
            try { fs.unlinkSync(filePath); } catch(e) {}

            // Kirim kembali Link Gambar ke Frontend
            res.status(200).json({ 
                success: true, 
                message: 'Bukti berhasil diupload.',
                imageUrl: imageLink 
            });

        } catch (error) {
            console.error("Upload Error:", error);
            // Jika upload gagal, kita tetap kirim sukses tapi tanpa link gambar (fallback)
            res.status(200).json({ 
                success: true, 
                message: 'Order diterima (Gambar gagal diupload ke cloud, kirim manual).',
                imageUrl: '(Gagal upload, sila hantar gambar secara manual)' 
            });
        }
    });
});

// --- RUTE DEFAULT ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- 404 Handler ---
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'API Endpoint tidak ditemukan.' });
    }
    res.status(404).send('File atau halaman tidak ditemukan.');
});

// --- Mulai Server ---
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
});

