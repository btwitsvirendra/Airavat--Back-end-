import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';
import { transformCategory } from '../utils/transform-response';

const prisma = new PrismaClient();

// Create Category
export async function createCategory(req: Request, res: Response) {
  try {
    const { 
      parent_category_id,
      category_name,
      slug,
      description,
      is_active,
      display_order
    } = req.body;

    if (!category_name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const newCategory = await prisma.categories.create({
      data: {
        parent_category_id: parent_category_id ? BigInt(parent_category_id) : null,
        category_name,
        slug,
        description,
        is_active: is_active !== undefined ? is_active : true,
        display_order,
      },
    });

    const safeCategory = convertBigIntToString(newCategory);
    return res.status(201).json({
      message: "Category created successfully",
      category: safeCategory,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create category" });
  }
}

// Get All Categories
export async function getAllCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.categories.findMany({
      include: {
        parent_category: true,
        subcategories: true,
      },
      orderBy: {
        display_order: 'asc',
      }
    });
    const safeCategories = convertBigIntToString(categories);
    const transformedCategories = safeCategories.map(transformCategory);
    res.json({ message: "Fetched all categories successfully", categories: transformedCategories });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch categories" });
  }
}

// Get Category by ID
export async function getCategoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = await prisma.categories.findUnique({
      where: { category_id: BigInt(id) },
      include: {
        parent_category: true,
        subcategories: true,
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const safeCategory = convertBigIntToString(category);
    const transformedCategory = transformCategory(safeCategory);
    res.json({ message: "Category fetched successfully", category: transformedCategory });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch category" });
  }
}

// Get Root Categories (parent categories)
export async function getRootCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.categories.findMany({
      where: { parent_category_id: null },
      include: {
        subcategories: true,
      },
      orderBy: {
        display_order: 'asc',
      }
    });
    const safeCategories = convertBigIntToString(categories);
    const transformedCategories = safeCategories.map(transformCategory);
    res.json({ message: "Fetched root categories successfully", categories: transformedCategories });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch root categories" });
  }
}

// Update Category
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.parent_category_id) {
      updateData.parent_category_id = BigInt(updateData.parent_category_id);
    }

    const updatedCategory = await prisma.categories.update({
      where: { category_id: BigInt(id) },
      data: updateData,
    });

    const safeCategory = convertBigIntToString(updatedCategory);
    res.json({ message: "Category updated successfully", category: safeCategory });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update category" });
  }
}

// Delete Category
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.categories.delete({
      where: { category_id: BigInt(id) },
    });

    res.json({ message: "Category deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete category" });
  }
}
