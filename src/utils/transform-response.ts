/**
 * Utility functions to transform database responses to match frontend expectations
 * Converts snake_case to camelCase and formats data structures
 */

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function transformObjectKeys(obj: any, transformFn: (key: string) => string): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectKeys(item, transformFn));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = transformFn(key);
        transformed[newKey] = transformObjectKeys(obj[key], transformFn);
      }
    }
    return transformed;
  }

  return obj;
}

/**
 * Converts a database response object from snake_case to camelCase
 */
export function toCamelCase(obj: any): any {
  return transformObjectKeys(obj, snakeToCamel);
}

/**
 * Transforms a product response to match frontend Product interface
 */
export function transformProduct(product: any): any {
  if (!product) return null;

  const transformed = toCamelCase(product);
  
  // Map specific fields to match frontend expectations
  return {
    ...transformed,
    id: transformed.productId || transformed.id,
    productId: transformed.productId || transformed.id,
    name: transformed.productName || transformed.name,
    product_name: transformed.productName,
    category: transformed.category?.categoryName || transformed.category,
    categoryId: transformed.categoryId || transformed.category?.categoryId,
    supplierId: transformed.businessId,
    businessId: transformed.businessId,
    stock: transformed.availableQuantity || transformed.available_quantity || 0,
    available_quantity: transformed.availableQuantity || transformed.available_quantity || 0,
    unit_in_stock: transformed.unitInStock || transformed.unit_in_stock || 0,
    minOrderQuantity: transformed.minOrderQuantity || transformed.min_order_quantity || 1,
    maxOrderQuantity: transformed.maxOrderQuantity || transformed.max_order_quantity,
    price: {
      amount: parseFloat(transformed.basePrice || transformed.base_price || 0),
      currency: transformed.currency?.currencyCode || transformed.currencyCode || 'INR',
      unit: transformed.priceUnit?.unitCode || transformed.priceUnit?.unitName || 'piece',
    },
    images: transformed.images?.map((img: any) => img.imageUrl || img.image_url) || [],
    supplier: transformed.business ? {
      id: transformed.business.businessId || transformed.business.id,
      name: transformed.business.businessName || transformed.business.business_name,
      location: transformed.business.city || transformed.business.state || '',
      rating: 4.5, // TODO: Calculate from reviews
    } : undefined,
    createdAt: transformed.createdAt || transformed.created_at,
    updatedAt: transformed.updatedAt || transformed.updated_at,
  };
}

/**
 * Transforms a category response to match frontend Category interface
 */
export function transformCategory(category: any): any {
  if (!category) return null;

  const transformed = toCamelCase(category);
  
  return {
    ...transformed,
    id: transformed.categoryId || transformed.id,
    categoryId: transformed.categoryId || transformed.id,
    name: transformed.categoryName || transformed.name,
    slug: transformed.slug,
    description: transformed.description,
    icon: transformed.icon || '📦', // Default icon
    parentId: transformed.parentCategoryId || transformed.parentId,
    subcategories: transformed.subcategories?.map(transformCategory) || transformed.children || [],
    children: transformed.subcategories?.map(transformCategory) || transformed.children || [],
    isActive: transformed.isActive !== undefined ? transformed.isActive : transformed.is_active !== undefined ? transformed.is_active : true,
    displayOrder: transformed.displayOrder || transformed.display_order,
    createdAt: transformed.createdAt || transformed.created_at,
    updatedAt: transformed.updatedAt || transformed.updated_at,
  };
}

/**
 * Transforms a user response to match frontend User interface
 */
export function transformUser(user: any): any {
  if (!user) return null;

  const transformed = toCamelCase(user);
  
  return {
    ...transformed,
    id: transformed.userId || transformed.id,
    userId: transformed.userId || transformed.id,
    name: transformed.fullName || transformed.name || transformed.full_name,
    full_name: transformed.fullName || transformed.full_name,
    email: transformed.email,
    phone: transformed.phone,
    role: transformed.role,
    isVerified: transformed.isVerified !== undefined ? transformed.isVerified : transformed.is_verified,
    emailVerified: transformed.emailVerified !== undefined ? transformed.emailVerified : transformed.email_verified,
    status: transformed.status,
    lastLogin: transformed.lastLogin || transformed.last_login,
    businesses: transformed.businesses?.map(transformBusiness) || [],
    createdAt: transformed.createdAt || transformed.created_at,
    updatedAt: transformed.updatedAt || transformed.updated_at,
  };
}

/**
 * Transforms a business response to match frontend Business/Supplier interface
 */
export function transformBusiness(business: any): any {
  if (!business) return null;

  const transformed = toCamelCase(business);
  
  return {
    ...transformed,
    id: transformed.businessId || transformed.id,
    businessId: transformed.businessId || transformed.id,
    userId: transformed.userId || transformed.user_id,
    name: transformed.businessName || transformed.name || transformed.business_name,
    businessName: transformed.businessName || transformed.business_name,
    displayName: transformed.displayName || transformed.display_name,
    description: transformed.description,
    canBuy: transformed.canBuy !== undefined ? transformed.canBuy : transformed.can_buy,
    canSell: transformed.canSell !== undefined ? transformed.canSell : transformed.can_sell,
    gstNumber: transformed.gstNumber || transformed.gst_number,
    panNumber: transformed.panNumber || transformed.pan_number,
    msmeNumber: transformed.msmeNumber || transformed.msme_number,
    isVerified: transformed.isVerified !== undefined ? transformed.isVerified : transformed.is_verified,
    verificationLevel: transformed.verificationLevel || transformed.verification_level,
    address: {
      line1: transformed.addressLine1 || transformed.address_line1,
      line2: transformed.addressLine2 || transformed.address_line2,
      city: transformed.city,
      state: transformed.state,
      country: transformed.country || 'India',
      pincode: transformed.pincode,
    },
    location: transformed.city || transformed.state || '',
    rating: 4.5, // TODO: Calculate from reviews
    businessType: transformed.businessType ? transformBusinessType(transformed.businessType) : transformed.business_type,
    createdAt: transformed.createdAt || transformed.created_at,
    updatedAt: transformed.updatedAt || transformed.updated_at,
  };
}

/**
 * Transforms a business type response
 */
export function transformBusinessType(businessType: any): any {
  if (!businessType) return null;

  const transformed = toCamelCase(businessType);
  
  return {
    ...transformed,
    id: transformed.businessTypeId || transformed.id,
    businessTypeId: transformed.businessTypeId || transformed.id,
    name: transformed.typeName || transformed.name || transformed.type_name,
    description: transformed.description,
    createdAt: transformed.createdAt || transformed.created_at,
  };
}

