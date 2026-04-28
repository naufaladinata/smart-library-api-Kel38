import { ReportModel } from '../models/reportModel.js';

export const ReportController = {
  async getStats(req, res) {
    try {
      const raw = await ReportModel.getStats();

      // Konversi string ke integer (COUNT() di PostgreSQL mengembalikan string)
      const stats = {
        total_buku:      parseInt(raw.total_books),
        total_authors:    parseInt(raw.total_authors),
        total_kategori: parseInt(raw.total_categories),
        total_peminjaman:     parseInt(raw.active_loans)
      };

      res.json({
        message: 'Statistik perpustakaan berhasil diambil.',
        data: stats
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};