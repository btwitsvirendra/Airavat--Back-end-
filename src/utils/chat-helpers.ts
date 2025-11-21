import { PrismaClient } from '@prisma/client';
import { convertBigIntToString } from './main';

const prisma = new PrismaClient();

/**
 * Create an order from a chat negotiation
 * This is called when buyer and seller agree on a deal in chat
 */
export async function createOrderFromChat(
  conversationId: string,
  buyerBusinessId: string,
  sellerBusinessId: string,
  productId: string,
  quantity: number,
  agreedPrice: number,
  currencyId: number = 1,
  additionalData?: any
) {
  try {
    // Get product details
    const product = await prisma.products.findUnique({
      where: { product_id: BigInt(productId) },
      include: {
        currency: true,
        price_unit: true,
        business: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify seller owns the product
    if (product.business_id?.toString() !== sellerBusinessId) {
      throw new Error('Product does not belong to the seller');
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate totals
    const subtotal = agreedPrice * quantity;
    const taxAmount = additionalData?.tax_amount || 0;
    const discountAmount = additionalData?.discount_amount || 0;
    const shippingAmount = additionalData?.shipping_amount || 0;
    const finalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Create order
    const order = await prisma.orders.create({
      data: {
        buyer_business_id: BigInt(buyerBusinessId),
        seller_business_id: BigInt(sellerBusinessId),
        order_number: orderNumber,
        currency_id: currencyId,
        status: 'pending',
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        final_amount: finalAmount,
        payment_status: 'pending',
        delivery_address: additionalData?.delivery_address,
        delivery_city: additionalData?.delivery_city,
        delivery_state: additionalData?.delivery_state,
        delivery_pincode: additionalData?.delivery_pincode,
        delivery_country: additionalData?.delivery_country || 'India',
        buyer_notes: additionalData?.buyer_notes || `Order created from chat conversation ${conversationId}`,
      },
      include: {
        buyer_business: true,
        seller_business: true,
        currency: true,
      },
    });

    // Create order item
    const orderItem = await prisma.order_items.create({
      data: {
        order_id: order.order_id,
        product_id: BigInt(productId),
        product_name: product.product_name,
        quantity_unit: quantity,
        unit_price: agreedPrice,
        total_price: subtotal,
        discount_rate: discountAmount > 0 ? discountAmount / subtotal : 0,
        tax_rate: taxAmount > 0 ? taxAmount / subtotal : 0,
        hs_code: product.hs_code,
      },
      include: {
        product: true,
      },
    });

    // Update conversation with order_id
    await prisma.conversations.update({
      where: { conversation_id: BigInt(conversationId) },
      data: { order_id: order.order_id },
    });

    // Create notification for seller
    const sellerBusiness = await prisma.business.findUnique({
      where: { business_id: BigInt(sellerBusinessId) },
      select: { user_id: true },
    });

    if (sellerBusiness) {
      await prisma.notifications.create({
        data: {
          user_id: sellerBusiness.user_id,
          business_id: BigInt(sellerBusinessId),
          type: 'order',
          title: 'New Order Received',
          message: `You received a new order: ${orderNumber}`,
          link: `/orders/${order.order_id}`,
          metadata: {
            order_id: order.order_id.toString(),
            order_number: orderNumber,
            buyer_business_id: buyerBusinessId,
          },
        },
      });
    }

    // Create notification for buyer
    const buyerBusiness = await prisma.business.findUnique({
      where: { business_id: BigInt(buyerBusinessId) },
      select: { user_id: true },
    });

    if (buyerBusiness) {
      await prisma.notifications.create({
        data: {
          user_id: buyerBusiness.user_id,
          business_id: BigInt(buyerBusinessId),
          type: 'order',
          title: 'Order Created',
          message: `Your order ${orderNumber} has been created successfully`,
          link: `/orders/${order.order_id}`,
          metadata: {
            order_id: order.order_id.toString(),
            order_number: orderNumber,
          },
        },
      });
    }

    const safeOrder = convertBigIntToString({
      ...order,
      order_items: [orderItem],
    });

    return safeOrder;
  } catch (error: any) {
    throw new Error(`Failed to create order from chat: ${error.message}`);
  }
}

/**
 * Create a quote from chat negotiation
 */
export async function createQuoteFromChat(
  conversationId: string,
  inquiryId: string,
  sellerBusinessId: string,
  price: number,
  quantity: number,
  validityDays: number = 30,
  deliveryTimeDays?: number,
  additionalTerms?: any
) {
  try {
    const inquiry = await prisma.inquiries.findUnique({
      where: { inquiry_id: BigInt(inquiryId) },
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const quotation = await prisma.quotations.create({
      data: {
        inquiry_id: BigInt(inquiryId),
        seller_business_id: BigInt(sellerBusinessId),
        validity_days: validityDays,
        delivery_time_days: deliveryTimeDays,
        payment_terms: additionalTerms?.payment_terms,
        other_terms: additionalTerms?.other_terms || `Quote created from chat. Price: ${price}, Quantity: ${quantity}`,
        status: 'sent',
      },
      include: {
        inquiry: true,
        seller_business: true,
      },
    });

    // Update inquiry status
    await prisma.inquiries.update({
      where: { inquiry_id: BigInt(inquiryId) },
      data: { status: 'quoted' },
    });

    // Create notification for buyer
    const buyerBusiness = await prisma.business.findUnique({
      where: { business_id: inquiry.buyer_business_id },
      select: { user_id: true },
    });

    if (buyerBusiness) {
      await prisma.notifications.create({
        data: {
          user_id: buyerBusiness.user_id,
          business_id: inquiry.buyer_business_id,
          type: 'quotation',
          title: 'New Quotation Received',
          message: `You received a new quotation for your inquiry`,
          link: `/quotations/${quotation.quotation_id}`,
          metadata: {
            quotation_id: quotation.quotation_id.toString(),
            inquiry_id: inquiryId,
          },
        },
      });
    }

    return convertBigIntToString(quotation);
  } catch (error: any) {
    throw new Error(`Failed to create quote from chat: ${error.message}`);
  }
}

