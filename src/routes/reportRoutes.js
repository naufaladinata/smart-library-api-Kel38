import express from 'express';
import { ReportController } from '../controllers/reportController.js';

const router = express.Router();

router.get('/stats', ReportController.getStats); //GET /api/reports/stats

export default router;