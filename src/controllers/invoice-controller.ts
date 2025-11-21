import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';

const prisma = new PrismaClient();

/**
 * Generate invoice number
 */
function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
}

/**
 * Create invoice from order or payment link
 */
export async function createInvoice(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      order_id,
      payment_link_id,
      seller_business_id,
      buyer_business_id,
      currency_id = 1,
      subtotal,
      tax_amount,
      discount_amount,
      shipping_amount,
      total_amount,
      due_date_days = 30,
      notes,
    } = req.body;

    const sellerBusinessId = seller_business_id || req.query.business_id;
    if (!sellerBusinessId) {
      return res.status(400).json({ error: 'seller_business_id is required' });
    }

    // Verify seller owns the business
    const sellerBusiness = await prisma.business.findFirst({
      where: {
        business_id: BigInt(sellerBusinessId),
        user_id: BigInt(userId),
        can_sell: true,
      },
    });

    if (!sellerBusiness) {
      return res.status(403).json({ error: 'You do not have permission to create invoices for this business' });
    }

    let invoiceItems = [];
    let calculatedSubtotal = 0;

    // Get items from order or payment link
    if (order_id) {
      const order = await prisma.orders.findUnique({
        where: { order_id: BigInt(order_id) },
        include: {
          order_items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.seller_business_id !== BigInt(sellerBusinessId)) {
        return res.status(403).json({ error: 'This order does not belong to your business' });
      }

      invoiceItems = order.order_items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name || item.product.product_name,
        quantity: item.quantity_unit || 1,
        unit_price: parseFloat(item.unit_price?.toString() || '0'),
        discount_rate: item.discount_rate ? parseFloat(item.discount_rate.toString()) : null,
        tax_rate: item.tax_rate ? parseFloat(item.tax_rate.toString()) : null,
        total_price: parseFloat(item.total_price?.toString() || '0'),
        description: null,
      }));

      calculatedSubtotal = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
    } else if (payment_link_id) {
      const paymentLink = await prisma.payment_links.findUnique({
        where: { payment_link_id: BigInt(payment_link_id) },
        include: {
          payment_link_items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!paymentLink) {
        return res.status(404).json({ error: 'Payment link not found' });
      }

      if (paymentLink.seller_business_id !== BigInt(sellerBusinessId)) {
        return res.status(403).json({ error: 'This payment link does not belong to your business' });
      }

      invoiceItems = paymentLink.payment_link_items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price.toString()),
        discount_rate: item.discount_rate ? parseFloat(item.discount_rate.toString()) : null,
        tax_rate: item.tax_rate ? parseFloat(item.tax_rate.toString()) : null,
        total_price: parseFloat(item.total_price.toString()),
        description: item.notes || null,
      }));

      calculatedSubtotal = parseFloat(paymentLink.total_amount.toString());
    } else {
      return res.status(400).json({ error: 'Either order_id or payment_link_id is required' });
    }

    // Use provided values or calculated values
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTax = tax_amount || 0;
    const finalDiscount = discount_amount || 0;
    const finalShipping = shipping_amount || 0;
    const finalTotal = total_amount || (finalSubtotal + finalTax - finalDiscount + finalShipping);

    // Calculate due date
    const dueDate = due_date_days
      ? new Date(Date.now() + due_date_days * 24 * 60 * 60 * 1000)
      : null;

    // Get buyer business if not provided
    let finalBuyerBusinessId = buyer_business_id;
    if (!finalBuyerBusinessId) {
      if (order_id) {
        const order = await prisma.orders.findUnique({
          where: { order_id: BigInt(order_id) },
        });
        if (order) finalBuyerBusinessId = order.buyer_business_id.toString();
      } else if (payment_link_id) {
        const paymentLink = await prisma.payment_links.findUnique({
          where: { payment_link_id: BigInt(payment_link_id) },
        });
        if (paymentLink && paymentLink.buyer_business_id) {
          finalBuyerBusinessId = paymentLink.buyer_business_id.toString();
        }
      }
    }

    if (!finalBuyerBusinessId) {
      return res.status(400).json({ error: 'buyer_business_id is required' });
    }

    // Create invoice
    const invoiceNumber = generateInvoiceNumber();
    const invoice = await prisma.invoices.create({
      data: {
        invoice_number: invoiceNumber,
        order_id: order_id ? BigInt(order_id) : null,
        payment_link_id: payment_link_id ? BigInt(payment_link_id) : null,
        seller_business_id: BigInt(sellerBusinessId),
        buyer_business_id: BigInt(finalBuyerBusinessId),
        currency_id,
        subtotal: finalSubtotal,
        tax_amount: finalTax || null,
        discount_amount: finalDiscount || null,
        shipping_amount: finalShipping || null,
        total_amount: finalTotal,
        status: 'draft',
        due_date: dueDate,
        notes,
      },
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            gst_number: true,
            pan_number: true,
            address_line1: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            gst_number: true,
            address_line1: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        currency: true,
      },
    });

    // Create invoice items
    for (const item of invoiceItems) {
      await prisma.invoice_items.create({
        data: {
          invoice_id: invoice.invoice_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate,
          tax_rate: item.tax_rate,
          total_price: item.total_price,
          description: item.description,
        },
      });
    }

    // Reload with items
    const fullInvoice = await prisma.invoices.findUnique({
      where: { invoice_id: invoice.invoice_id },
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            gst_number: true,
            pan_number: true,
            address_line1: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            gst_number: true,
            address_line1: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        currency: true,
        invoice_items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const safeInvoice = convertBigIntToString(fullInvoice);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: safeInvoice,
    });
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    return res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { invoice_id } = req.params;

    const invoice = await prisma.invoices.findUnique({
      where: { invoice_id: BigInt(invoice_id) },
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            gst_number: true,
            pan_number: true,
            address_line1: true,
            address_line2: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            primary_contact_phone: true,
            primary_contact_email: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
            gst_number: true,
            address_line1: true,
            address_line2: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            primary_contact_phone: true,
            primary_contact_email: true,
          },
        },
        currency: true,
        invoice_items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        order: {
          select: {
            order_id: true,
            order_number: true,
            status: true,
          },
        },
        payment_link: {
          select: {
            payment_link_id: true,
            link_code: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify user has access (seller or buyer)
    if (userId) {
      const sellerOwns = invoice.seller_business_id && 
        await prisma.business.findFirst({
          where: {
            business_id: invoice.seller_business_id,
            user_id: BigInt(userId),
          },
        });

      const buyerOwns = invoice.buyer_business_id &&
        await prisma.business.findFirst({
          where: {
            business_id: invoice.buyer_business_id,
            user_id: BigInt(userId),
          },
        });

      if (!sellerOwns && !buyerOwns) {
        return res.status(403).json({ error: 'You do not have permission to view this invoice' });
      }
    }

    const safeInvoice = convertBigIntToString(invoice);

    return res.status(200).json({
      success: true,
      data: safeInvoice,
    });
  } catch (err: any) {
    console.error('Error fetching invoice:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch invoice' });
  }
}

/**
 * Get all invoices for a business (seller or buyer)
 */
export async function getBusinessInvoices(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { business_id } = req.params;
    const { role = 'seller', status, page = 1, limit = 20 } = req.query;

    // Verify user owns the business
    const business = await prisma.business.findFirst({
      where: {
        business_id: BigInt(business_id),
        user_id: BigInt(userId),
      },
    });

    if (!business) {
      return res.status(403).json({ error: 'You do not have permission to view invoices for this business' });
    }

    const where: any = {};
    if (role === 'seller') {
      where.seller_business_id = BigInt(business_id);
    } else {
      where.buyer_business_id = BigInt(business_id);
    }

    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          seller_business: {
            select: {
              business_id: true,
              business_name: true,
              display_name: true,
            },
          },
          buyer_business: {
            select: {
              business_id: true,
              business_name: true,
              display_name: true,
            },
          },
          currency: true,
          invoice_items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { is_primary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.invoices.count({ where }),
    ]);

    const safeInvoices = convertBigIntToString(invoices);

    return res.status(200).json({
      success: true,
      data: safeInvoices,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (err: any) {
    console.error('Error fetching invoices:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch invoices' });
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { invoice_id } = req.params;
    const { status, pdf_url } = req.body;

    const invoice = await prisma.invoices.findUnique({
      where: { invoice_id: BigInt(invoice_id) },
      include: {
        seller_business: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify seller owns the business
    if (invoice.seller_business.user_id !== BigInt(userId)) {
      return res.status(403).json({ error: 'You do not have permission to update this invoice' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (pdf_url) updateData.pdf_url = pdf_url;
    if (status === 'paid') updateData.paid_at = new Date();

    const updatedInvoice = await prisma.invoices.update({
      where: { invoice_id: BigInt(invoice_id) },
      data: updateData,
      include: {
        seller_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        buyer_business: {
          select: {
            business_id: true,
            business_name: true,
            display_name: true,
          },
        },
        currency: true,
        invoice_items: {
          include: {
            product: true,
          },
        },
      },
    });

    const safeInvoice = convertBigIntToString(updatedInvoice);

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: safeInvoice,
    });
  } catch (err: any) {
    console.error('Error updating invoice:', err);
    return res.status(500).json({ error: err.message || 'Failed to update invoice' });
  }
}

