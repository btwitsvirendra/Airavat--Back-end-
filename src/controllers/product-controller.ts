import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';
import { transformProduct } from '../utils/transform-response';

const prisma = new PrismaClient();

// Create Product
export async function createProduct(req: Request, res: Response) {
  try {
    const { 
      business_id,
      category_id,
      currency_id,
      price_unit_id,
      product_name,
      slug,
      description,
      specifications,
      base_price,
      min_order_quantity,
      max_order_quantity,
      unit_in_stock,
      available_quantity,
      hs_code,
      brand,
      manufacturer,
      country_of_origin,
      status,
      is_featured
    } = req.body;

    if (!category_id || !product_name) {
      return res.status(400).json({ error: "Category ID and product name are required" });
    }

    const newProduct = await prisma.products.create({
      data: {
        business_id: business_id ? BigInt(business_id) : null,
        category_id: BigInt(category_id),
        currency_id: currency_id || 1, // Defaults to USD (currency_id = 1)
        price_unit_id: price_unit_id || 1,
        product_name,
        slug,
        description,
        specifications,
        base_price,
        min_order_quantity,
        max_order_quantity,
        unit_in_stock,
        available_quantity,
        hs_code,
        brand,
        manufacturer,
        country_of_origin,
        status: status || 'draft',
        is_featured: is_featured || false,
      },
      include: {
        category: true,
        currency: true,
        price_unit: true,
        business: true,
      }
    });

    const safeProduct = convertBigIntToString(newProduct);
    return res.status(201).json({
      message: "Product created successfully",
      product: safeProduct,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create product" });
  }
}

// Get All Products
export async function getAllProducts(req: Request, res: Response) {
  try {
    const { category_id, status, is_featured, business_id, currency_id } = req.query;
    
    const where: any = {};
    if (category_id) where.category_id = BigInt(category_id as string);
    if (business_id) where.business_id = BigInt(business_id as string);
    if (status) where.status = status;
    if (currency_id) where.currency_id = parseInt(currency_id as string);
    if (is_featured !== undefined) where.is_featured = is_featured === 'true';

    const products = await prisma.products.findMany({
      where,
      include: {
        category: true,
        currency: true,
        price_unit: true,
        business: true,
        images: true,
      }
    });
    const safeProducts = convertBigIntToString(products);
    const transformedProducts = safeProducts.map(transformProduct);
    res.json({ message: "Fetched all products successfully", products: transformedProducts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch products" });
  }
}

// Get Product by ID
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await prisma.products.findUnique({
      where: { product_id: BigInt(id) },
      include: {
        category: true,
        currency: true,
        price_unit: true,
        business: true,
        images: true,
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const safeProduct = convertBigIntToString(product);
    const transformedProduct = transformProduct(safeProduct);
    res.json({ message: "Product fetched successfully", product: transformedProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch product" });
  }
}

// Update Product
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.category_id) {
      updateData.category_id = BigInt(updateData.category_id);
    }
    if (updateData.business_id) {
      updateData.business_id = BigInt(updateData.business_id);
    }
    if (updateData.currency_id) {
      updateData.currency_id = parseInt(updateData.currency_id);
    }
    if (updateData.price_unit_id) {
      updateData.price_unit_id = parseInt(updateData.price_unit_id);
    }

    const updatedProduct = await prisma.products.update({
      where: { product_id: BigInt(id) },
      data: updateData,
      include: {
        category: true,
        currency: true,
        price_unit: true,
        business: true,
      }
    });

    const safeProduct = convertBigIntToString(updatedProduct);
    res.json({ message: "Product updated successfully", product: safeProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
}

// Delete Product
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.products.delete({
      where: { product_id: BigInt(id) },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete product" });
  }
}

// Search Products
export async function searchProducts(req: Request, res: Response) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const products = await prisma.products.findMany({
      where: {
        OR: [
          { product_name: { contains: query as string, mode: 'insensitive' } },
          { description: { contains: query as string, mode: 'insensitive' } },
          { brand: { contains: query as string, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        currency: true,
        price_unit: true,
        business: true,
        images: true,
      }
    });

    const safeProducts = convertBigIntToString(products);
    const transformedProducts = safeProducts.map(transformProduct);
    res.json({ message: "Search completed successfully", products: transformedProducts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Search failed" });
  }
}
