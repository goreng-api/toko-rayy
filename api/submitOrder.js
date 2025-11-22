import formidable from 'formidable';
import fs from 'fs';
import { Blob } from 'buffer'; // Modul untuk menangani file di Vercel

// Konfigurasi Vercel
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper Parse Form
const parseForm = (req) => {
    return new Promise((resolve, reject) => {
        const form = formidable({ 
            maxFileSize: 10 * 1024 * 1024, // Naikkan limit ke 10MB
            uploadDir: '/tmp', 
            keepExtensions: true,
        });
        
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { files } = await parseForm(req);
        const buktiFile = Array.isArray(files.buktiTf) ? files.buktiTf[0] : files.buktiTf;

        if (!buktiFile) {
            return res.status(400).json({ success: false, message: 'Tiada fail diupload.' });
        }

        let imageLink = null;

        try {
            // --- METODE BARU: Upload ke Catbox.moe (Lebih Stabil) ---
            // 1. Baca file dari folder sementara
            const fileBuffer = fs.readFileSync(buktiFile.filepath);
            
            // 2. Buat Form Data manual
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('userhash', ''); // Tidak butuh akun
            formData.append('fileToUpload', new Blob([fileBuffer]), 'bukti-pembayaran.jpg');

            // 3. Kirim ke API Catbox
            const uploadRes = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });

            if (uploadRes.ok) {
                const responseText = await uploadRes.text();
                // Catbox mengembalikan URL mentah jika sukses
                if (responseText.startsWith('http')) {
                    imageLink = responseText.trim();
                }
            }
        } catch (uploadError) {
            console.error("Gagal upload ke Catbox:", uploadError);
        }

        // Bersihkan file temp
        try { fs.unlinkSync(buktiFile.filepath); } catch (e) {}

        // --- HASIL ---
        if (imageLink) {
            return res.status(200).json({ 
                success: true, 
                imageUrl: imageLink,
                message: 'Berjaya upload!' 
            });
        } else {
            // Jika masih gagal, kita pakai fallback teks tapi format tetap rapi
            return res.status(200).json({ 
                success: true, 
                imageUrl: '(Gambar gagal diupload, sila hantar manual)',
                message: 'Server sibuk.'
            });
        }

    } catch (error) {
        console.error('System Error:', error);
        return res.status(200).json({ 
            success: false, 
            message: 'Ralat sistem: ' + error.message 
        });
    }
};


