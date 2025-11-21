import { Router } from 'express';
import {
  createInvoice,
  getInvoiceById,
  getBusinessInvoices,
  updateInvoiceStatus,
} from '../controllers/invoice-controller';
import { authenticateToken } from '../middlewares/auth-middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create invoice
router.post('/', createInvoice);

// Get invoice by ID
router.get('/:invoice_id', getInvoiceById);

// Get business invoices (seller or buyer)
router.get('/business/:business_id', getBusinessInvoices);

// Update invoice status
router.put('/:invoice_id/status', updateInvoiceStatus);

export default router;

