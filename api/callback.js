import TelegramBot from 'node-telegram-bot-api';

// Menonaktifkan peringatan
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

export default async (req, res) => {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!TOKEN) {
        console.error('Token Telegram tiada untuk callback');
        return res.status(500).send('Ralat Konfigurasi');
    }

    const bot = new TelegramBot(TOKEN);

    try {
        const { body } = req;

        // Pastikan ini adalah callback_query
        if (body && body.callback_query) {
            const query = body.callback_query;
            const queryId = query.id;
            const data = query.data; // cth: 'copy_reply:NamaProduk:NamaCust:60123:user'
            const message = query.message;
            const chatId = message.chat.id;
            const messageId = message.message_id;

            // [DIUBAH] Tangani callback 'copy_reply'
            if (data.startsWith('copy_reply:')) {
                
                // Ambil data dari tombol
                const parts = data.split(':');
                const productName = parts[1] || 'Produk';
                const namaPelanggan = parts[2] || 'Pelanggan';
                const nomorHp = parts[3] || '';
                const usernameTelegram = parts[4] || '';

                // Tentukan kontak utama
                let contactInfo = '';
                if (nomorHp && nomorHp !== 'Tiada') {
                    contactInfo = `WhatsApp (${nomorHp})`;
                } else if (usernameTelegram && usernameTelegram !== 'Tiada') {
                    contactInfo = `Telegram (${usernameTelegram})`;
                }

                // [BARU] Buat teks balasan otomatis yang bagus
                const replyText = `
Helo ${namaPelanggan}, terima kasih atas pembelian anda! 

Pesanan anda untuk *${productName}* telah disahkan.

Kami akan segera menghantar fail/data pesanan anda ke ${contactInfo}.

Sila tunggu sebentar ya. Terima kasih sekali lagi!
- *RAYY SETTING 7 - RS7*
                `;

                // [DIUBAH] Kirim teks balasan sebagai notifikasi popup (alert)
                // Owner bisa copy teks ini dari popup
                await bot.answerCallbackQuery(queryId, {
                    text: replyText.trim(), // Kirim teks lengkap di sini
                    show_alert: true // Tampilkan sebagai popup besar
                });

                // Penting: Kita TIDAK MENGHAPUS tombol
                // Jadi owner bisa klik copy kapan saja
            }

            // Kirim respons OK 200 ke Telegram agar tidak timeout
            return res.status(200).send('Callback diterima');
        }

        return res.status(200).send('Bukan callback');

    } catch (error) {
        console.error('Ralat di /api/callback:', error);
        return res.status(500).send('Ralat Pelayan');
    }
};
