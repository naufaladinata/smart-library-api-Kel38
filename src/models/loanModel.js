import { pool } from '../config/db.js';

export const LoanModel = {
  async createLoan(book_id, member_id, due_date) {
    const client = await pool.connect(); // Menggunakan client untuk transaksi
    try {
      await client.query('BEGIN'); // Mulai transaksi database

      // 1. Cek ketersediaan buku
      const bookCheck = await client.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
      if (bookCheck.rows[0].available_copies <= 0) {
        throw new Error('Buku sedang tidak tersedia (stok habis).');
      }

      // 2. Kurangi stok buku
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);

      // 3. Catat transaksi peminjaman
      const loanQuery = `
        INSERT INTO loans (book_id, member_id, due_date) 
        VALUES ($1, $2, $3) RETURNING *
      `;
      const result = await client.query(loanQuery, [book_id, member_id, due_date]);

      await client.query('COMMIT'); // Simpan semua perubahan
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Batalkan jika ada error
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllLoans() {
    const query = `
      SELECT l.*, b.title as book_title, m.full_name as member_name 
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getById(id) {
    const query = `
      SELECT l.*, b.title AS book_title, m.full_name AS member_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async returnLoan(loan_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cek apakah loan ada dan statusnya masih BORROWED
      const loanCheck = await client.query(
        'SELECT * FROM loans WHERE id = $1',
        [loan_id]
      );

      if (loanCheck.rows.length === 0) {
        throw new Error('Data peminjaman tidak ditemukan.');
      }

      const loan = loanCheck.rows[0];

      if (loan.status === 'RETURNED') {
        throw new Error('Buku ini sudah dikembalikan sebelumnya.');
      }

      // 2. Update status loan menjadi RETURNED dan isi return_date
      const updatedLoan = await client.query(
        `UPDATE loans
        SET status = 'RETURNED', return_date = CURRENT_DATE
        WHERE id = $1
        RETURNING *`,
        [loan_id]
      );

      // 3. Tambah kembali available_copies pada tabel books
      await client.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
        [loan.book_id]
      );

      await client.query('COMMIT');
      return updatedLoan.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteLoan(id) {//menghapus loan
    const query = 'DELETE FROM loans WHERE id = $1';
    await pool.query(query, [id]);
    return { message: "Peminjaman berhasil dihapus dari sistem." };
  },

  async getTopBorrowers() {
    const query = `
      WITH borrower_stats AS (
        -- Hitung total pinjaman dan tanggal pinjaman terakhir per member
        SELECT
          member_id,
          COUNT(*)            AS total_loans,
          MAX(loan_date)      AS last_loan_date
        FROM loans
        GROUP BY member_id
        ORDER BY total_loans DESC
        LIMIT 3
      ),
      favorite_books AS (
        -- Cari buku yang paling sering dipinjam per member
        SELECT DISTINCT ON (l.member_id)
          l.member_id,
          b.title             AS favorite_title,
          COUNT(l.book_id)    AS times_borrowed
        FROM loans l
        JOIN books b ON l.book_id = b.id
        GROUP BY l.member_id, b.title
        ORDER BY l.member_id, times_borrowed DESC
      )
      SELECT
        m.id            AS member_id,
        m.full_name,
        m.email,
        m.member_type,
        bs.total_loans,
        bs.last_loan_date,
        fb.favorite_title,
        fb.times_borrowed
      FROM borrower_stats bs
      JOIN members m  ON bs.member_id  = m.id
      JOIN favorite_books fb ON fb.member_id = m.id
      ORDER BY bs.total_loans DESC
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({//susun ulang response agar nested sesuai format yang diinginkan
      member_id:      row.member_id,
      full_name:      row.full_name,
      email:          row.email,
      member_type:    row.member_type,
      total_loans:    parseInt(row.total_loans),
      last_loan_date: row.last_loan_date,
      favorite_book: {
        title:          row.favorite_title,
        times_borrowed: parseInt(row.times_borrowed)
      }
    }));
  }
};