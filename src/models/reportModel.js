import { pool } from '../config/db.js';

export const ReportModel = {
  async getStats() {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM books)                              AS total_books,
        (SELECT COUNT(*) FROM authors)                           AS total_authors,
        (SELECT COUNT(*) FROM categories)                        AS total_categories,
        (SELECT COUNT(*) FROM loans WHERE status = 'BORROWED')   AS active_loans
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
};