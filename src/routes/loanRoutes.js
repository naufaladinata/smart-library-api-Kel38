import express from 'express';
import { LoanController } from '../controllers/loanController.js';

const router = express.Router();

router.get('/top-borrowers', LoanController.getTopBorrowers); //harus di aatas :/id karena nyocokin routes dari atas ke bawah biar strg top borrower tidak dianggap nilai param /:id
router.get('/', LoanController.getLoans);
router.get('/:id', LoanController.getLoanById);
router.post('/', LoanController.createLoan);
router.patch('/:id/return', LoanController.returnLoan) //PATCH mengembalikan pinjaman
router.delete('/:id', LoanController.deleteLoan);

export default router;