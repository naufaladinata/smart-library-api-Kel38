import { LoanModel } from '../models/loanModel.js';

export const LoanController = {
  async createLoan(req, res) {
    const { book_id, member_id, due_date } = req.body;
    try {
      const loan = await LoanModel.createLoan(book_id, member_id, due_date);
      res.status(201).json({
        message: "Peminjaman berhasil dicatat!",
        data: loan
      });
    } catch (err) {
      //jika stok habis atau ID salah, kirim status 400 (Bad Request)
      res.status(400).json({ error: err.message });
    }
  },

  async getLoans(req, res) {
    try {
      const loans = await LoanModel.getAllLoans();
      res.json(loans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getLoanById(req, res) {//GET /api/loans/:id
    try {
      const loans = await LoanModel.getById(req.params.id);
      if (!loans) return res.status(404).json({ error: 'Peminjaman tidak ditemukan.' });
      res.json(loans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async returnLoan(req, res) {
    try {
      const returned = await LoanModel.returnLoan(req.params.id);
      res.json({
        message: 'Buku berhasil dikembalikan. Stok telah diperbarui.',
        data: returned
      });
    } catch (err) {
      //jika buku sudah dikembalikan atau ID tidak ditemukan, kirim status 400 (Bad Request)
      res.status(400).json({ error: err.message });
    }
  },

  async deleteLoan(req, res) {//DELETE /api/loans/:id
    try {
      const existing = await LoanModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Peminjaman tidak ditemukan.' });
      const result = await LoanModel.deleteLoan(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTopBorrowers(req, res) {
    try {
      const data = await LoanModel.getTopBorrowers();
      res.json({
        message: 'Top 3 peminjam buku berhasil diambil.',
        data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};