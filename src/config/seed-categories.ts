import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// B2B Marketplace Categories
const categories = [
  // 1. Industrial Machinery & Equipment
  {
    category_name: 'Industrial Machinery & Equipment',
    slug: 'industrial-machinery-equipment',
    description: 'Heavy machinery, manufacturing equipment, and industrial tools',
    is_active: true,
    display_order: 1,
    subcategories: [
      { category_name: 'Manufacturing Machinery', slug: 'manufacturing-machinery', display_order: 1 },
      { category_name: 'Construction Equipment', slug: 'construction-equipment', display_order: 2 },
      { category_name: 'Agricultural Machinery', slug: 'agricultural-machinery', display_order: 3 },
      { category_name: 'Mining Equipment', slug: 'mining-equipment', display_order: 4 },
      { category_name: 'Industrial Automation', slug: 'industrial-automation', display_order: 5 },
      { category_name: 'Material Handling Equipment', slug: 'material-handling-equipment', display_order: 6 },
    ]
  },

  // 2. Electronics & Components
  {
    category_name: 'Electronics & Components',
    slug: 'electronics-components',
    description: 'Electronic components, circuit boards, and electrical equipment',
    is_active: true,
    display_order: 2,
    subcategories: [
      { category_name: 'Semiconductors & ICs', slug: 'semiconductors-ics', display_order: 1 },
      { category_name: 'Circuit Boards & PCB', slug: 'circuit-boards-pcb', display_order: 2 },
      { category_name: 'Electronic Components', slug: 'electronic-components', display_order: 3 },
      { category_name: 'Electrical Equipment', slug: 'electrical-equipment', display_order: 4 },
      { category_name: 'Power Supplies', slug: 'power-supplies', display_order: 5 },
      { category_name: 'Cables & Wiring', slug: 'cables-wiring', display_order: 6 },
    ]
  },

  // 3. Textiles & Apparel
  {
    category_name: 'Textiles & Apparel',
    slug: 'textiles-apparel',
    description: 'Fabrics, garments, and textile materials for bulk orders',
    is_active: true,
    display_order: 3,
    subcategories: [
      { category_name: 'Raw Fabrics & Textiles', slug: 'raw-fabrics-textiles', display_order: 1 },
      { category_name: 'Finished Garments', slug: 'finished-garments', display_order: 2 },
      { category_name: 'Workwear & Uniforms', slug: 'workwear-uniforms', display_order: 3 },
      { category_name: 'Home Textiles', slug: 'home-textiles', display_order: 4 },
      { category_name: 'Leather & Leather Products', slug: 'leather-leather-products', display_order: 5 },
      { category_name: 'Textile Accessories', slug: 'textile-accessories', display_order: 6 },
    ]
  },

  // 4. Chemicals & Materials
  {
    category_name: 'Chemicals & Materials',
    slug: 'chemicals-materials',
    description: 'Industrial chemicals, raw materials, and chemical products',
    is_active: true,
    display_order: 4,
    subcategories: [
      { category_name: 'Industrial Chemicals', slug: 'industrial-chemicals', display_order: 1 },
      { category_name: 'Plastics & Polymers', slug: 'plastics-polymers', display_order: 2 },
      { category_name: 'Adhesives & Sealants', slug: 'adhesives-sealants', display_order: 3 },
      { category_name: 'Paints & Coatings', slug: 'paints-coatings', display_order: 4 },
      { category_name: 'Rubber & Rubber Products', slug: 'rubber-rubber-products', display_order: 5 },
      { category_name: 'Laboratory Chemicals', slug: 'laboratory-chemicals', display_order: 6 },
    ]
  },

  // 5. Packaging & Printing
  {
    category_name: 'Packaging & Printing',
    slug: 'packaging-printing',
    description: 'Packaging materials, printing services, and supplies',
    is_active: true,
    display_order: 5,
    subcategories: [
      { category_name: 'Packaging Materials', slug: 'packaging-materials', display_order: 1 },
      { category_name: 'Corrugated Boxes', slug: 'corrugated-boxes', display_order: 2 },
      { category_name: 'Plastic Packaging', slug: 'plastic-packaging', display_order: 3 },
      { category_name: 'Labels & Tags', slug: 'labels-tags', display_order: 4 },
      { category_name: 'Printing Services', slug: 'printing-services', display_order: 5 },
      { category_name: 'Packaging Machinery', slug: 'packaging-machinery', display_order: 6 },
    ]
  },

  // 6. Food & Beverage
  {
    category_name: 'Food & Beverage',
    slug: 'food-beverage',
    description: 'Food ingredients, beverages, and food processing supplies',
    is_active: true,
    display_order: 6,
    subcategories: [
      { category_name: 'Food Ingredients', slug: 'food-ingredients', display_order: 1 },
      { category_name: 'Beverages (Bulk)', slug: 'beverages-bulk', display_order: 2 },
      { category_name: 'Food Additives', slug: 'food-additives', display_order: 3 },
      { category_name: 'Dairy Products', slug: 'dairy-products', display_order: 4 },
      { category_name: 'Spices & Seasonings', slug: 'spices-seasonings', display_order: 5 },
      { category_name: 'Food Processing Equipment', slug: 'food-processing-equipment', display_order: 6 },
    ]
  },

  // 7. Construction & Building Materials
  {
    category_name: 'Construction & Building Materials',
    slug: 'construction-building-materials',
    description: 'Building materials, construction supplies, and hardware',
    is_active: true,
    display_order: 7,
    subcategories: [
      { category_name: 'Cement & Concrete', slug: 'cement-concrete', display_order: 1 },
      { category_name: 'Steel & Metal Products', slug: 'steel-metal-products', display_order: 2 },
      { category_name: 'Tiles & Flooring', slug: 'tiles-flooring', display_order: 3 },
      { category_name: 'Doors & Windows', slug: 'doors-windows', display_order: 4 },
      { category_name: 'Plumbing Materials', slug: 'plumbing-materials', display_order: 5 },
      { category_name: 'Building Hardware', slug: 'building-hardware', display_order: 6 },
    ]
  },

  // 8. Office & Business Supplies
  {
    category_name: 'Office & Business Supplies',
    slug: 'office-business-supplies',
    description: 'Office equipment, furniture, and business supplies',
    is_active: true,
    display_order: 8,
    subcategories: [
      { category_name: 'Office Furniture', slug: 'office-furniture', display_order: 1 },
      { category_name: 'Office Equipment', slug: 'office-equipment', display_order: 2 },
      { category_name: 'Stationery Products', slug: 'stationery-products', display_order: 3 },
      { category_name: 'Paper Products', slug: 'paper-products', display_order: 4 },
      { category_name: 'Printing & Copying', slug: 'printing-copying', display_order: 5 },
      { category_name: 'Presentation Equipment', slug: 'presentation-equipment', display_order: 6 },
    ]
  },

  // 9. Healthcare & Medical
  {
    category_name: 'Healthcare & Medical',
    slug: 'healthcare-medical',
    description: 'Medical equipment, pharmaceuticals, and healthcare supplies',
    is_active: true,
    display_order: 9,
    subcategories: [
      { category_name: 'Medical Equipment', slug: 'medical-equipment', display_order: 1 },
      { category_name: 'Diagnostic Equipment', slug: 'diagnostic-equipment', display_order: 2 },
      { category_name: 'Medical Consumables', slug: 'medical-consumables', display_order: 3 },
      { category_name: 'Hospital Furniture', slug: 'hospital-furniture', display_order: 4 },
      { category_name: 'Laboratory Equipment', slug: 'laboratory-equipment', display_order: 5 },
      { category_name: 'Personal Protective Equipment', slug: 'personal-protective-equipment', display_order: 6 },
    ]
  },

  // 10. Automotive & Transportation
  {
    category_name: 'Automotive & Transportation',
    slug: 'automotive-transportation',
    description: 'Auto parts, vehicles, and transportation equipment',
    is_active: true,
    display_order: 10,
    subcategories: [
      { category_name: 'Auto Parts & Accessories', slug: 'auto-parts-accessories', display_order: 1 },
      { category_name: 'Commercial Vehicles', slug: 'commercial-vehicles', display_order: 2 },
      { category_name: 'Tires & Wheels', slug: 'tires-wheels', display_order: 3 },
      { category_name: 'Vehicle Electronics', slug: 'vehicle-electronics', display_order: 4 },
      { category_name: 'Automotive Tools', slug: 'automotive-tools', display_order: 5 },
      { category_name: 'Fleet Management Equipment', slug: 'fleet-management-equipment', display_order: 6 },
    ]
  },

  // 11. Energy & Power
  {
    category_name: 'Energy & Power',
    slug: 'energy-power',
    description: 'Energy equipment, power generation, and renewable energy',
    is_active: true,
    display_order: 11,
    subcategories: [
      { category_name: 'Solar Panels & Equipment', slug: 'solar-panels-equipment', display_order: 1 },
      { category_name: 'Generators', slug: 'generators', display_order: 2 },
      { category_name: 'Batteries & Power Storage', slug: 'batteries-power-storage', display_order: 3 },
      { category_name: 'Electrical Transformers', slug: 'electrical-transformers', display_order: 4 },
      { category_name: 'Wind Energy Equipment', slug: 'wind-energy-equipment', display_order: 5 },
      { category_name: 'Power Distribution', slug: 'power-distribution', display_order: 6 },
    ]
  },

  // 12. IT & Telecommunications
  {
    category_name: 'IT & Telecommunications',
    slug: 'it-telecommunications',
    description: 'IT hardware, networking equipment, and telecom products',
    is_active: true,
    display_order: 12,
    subcategories: [
      { category_name: 'Computer Hardware', slug: 'computer-hardware', display_order: 1 },
      { category_name: 'Networking Equipment', slug: 'networking-equipment', display_order: 2 },
      { category_name: 'Servers & Storage', slug: 'servers-storage', display_order: 3 },
      { category_name: 'Telecom Equipment', slug: 'telecom-equipment', display_order: 4 },
      { category_name: 'Security Systems', slug: 'security-systems', display_order: 5 },
      { category_name: 'Software & Licenses', slug: 'software-licenses', display_order: 6 },
    ]
  },

  // 13. Beauty & Personal Care
  {
    category_name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Beauty products, cosmetics, and personal care items (wholesale)',
    is_active: true,
    display_order: 13,
    subcategories: [
      { category_name: 'Cosmetics (Bulk)', slug: 'cosmetics-bulk', display_order: 1 },
      { category_name: 'Skincare Products', slug: 'skincare-products', display_order: 2 },
      { category_name: 'Hair Care Products', slug: 'hair-care-products', display_order: 3 },
      { category_name: 'Personal Hygiene', slug: 'personal-hygiene', display_order: 4 },
      { category_name: 'Salon Equipment', slug: 'salon-equipment', display_order: 5 },
      { category_name: 'Beauty Packaging', slug: 'beauty-packaging', display_order: 6 },
    ]
  },

  // 14. Furniture & Home Decor
  {
    category_name: 'Furniture & Home Decor',
    slug: 'furniture-home-decor',
    description: 'Commercial furniture and home decor products',
    is_active: true,
    display_order: 14,
    subcategories: [
      { category_name: 'Commercial Furniture', slug: 'commercial-furniture', display_order: 1 },
      { category_name: 'Hotel & Restaurant Furniture', slug: 'hotel-restaurant-furniture', display_order: 2 },
      { category_name: 'Home Decor Items', slug: 'home-decor-items', display_order: 3 },
      { category_name: 'Lighting Fixtures', slug: 'lighting-fixtures', display_order: 4 },
      { category_name: 'Outdoor Furniture', slug: 'outdoor-furniture', display_order: 5 },
      { category_name: 'Interior Design Materials', slug: 'interior-design-materials', display_order: 6 },
    ]
  },

  // 15. Safety & Security
  {
    category_name: 'Safety & Security',
    slug: 'safety-security',
    description: 'Safety equipment, security systems, and protective gear',
    is_active: true,
    display_order: 15,
    subcategories: [
      { category_name: 'Industrial Safety Equipment', slug: 'industrial-safety-equipment', display_order: 1 },
      { category_name: 'Fire Safety Equipment', slug: 'fire-safety-equipment', display_order: 2 },
      { category_name: 'Security Cameras & Surveillance', slug: 'security-cameras-surveillance', display_order: 3 },
      { category_name: 'Access Control Systems', slug: 'access-control-systems', display_order: 4 },
      { category_name: 'Protective Clothing', slug: 'protective-clothing', display_order: 5 },
      { category_name: 'Emergency Response Equipment', slug: 'emergency-response-equipment', display_order: 6 },
    ]
  },
];

async function seedCategories() {
  console.log('Starting category seeding...');

  for (const categoryData of categories) {
    const { subcategories, ...parentData } = categoryData;

    // Create parent category
    const parentCategory = await prisma.categories.create({
      data: {
        category_name: parentData.category_name,
        slug: parentData.slug,
        description: parentData.description,
        is_active: parentData.is_active,
        display_order: parentData.display_order,
      },
    });

    console.log(`✓ Created parent category: ${parentCategory.category_name}`);

    // Create subcategories
    if (subcategories && subcategories.length > 0) {
      for (const subcat of subcategories) {
        await prisma.categories.create({
          data: {
            category_name: subcat.category_name,
            slug: subcat.slug,
            parent_category_id: parentCategory.category_id,
            is_active: true,
            display_order: subcat.display_order,
          },
        });
        console.log(`  ✓ Created subcategory: ${subcat.category_name}`);
      }
    }
  }

  console.log('\n✅ Category seeding completed successfully!');
}

seedCategories()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
