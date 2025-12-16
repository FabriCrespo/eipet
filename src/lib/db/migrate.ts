/**
 * Script de migración para importar productos desde products.json a Firestore
 * Este script debe ejecutarse client-side o en un entorno Node.js
 */

import productsData from '../../data/products.json';
import { createProduct } from './products';
import type { CreateProductData } from './types';

/**
 * Migrar todos los productos desde products.json a Firestore
 */
export async function migrateProducts(): Promise<{ success: number; errors: number }> {
  let successCount = 0;
  let errorCount = 0;

  console.log(`Iniciando migración de ${productsData.products.length} productos...`);

  for (const product of productsData.products) {
    try {
      // Convertir el formato del JSON al formato de CreateProductData
      const productData: CreateProductData = {
        name: product.name,
        brand: product.brand,
        category: product.category as 'dog' | 'cat',
        type: product.type as 'food' | 'toy' | 'cleaning' | 'accessory',
        price: product.price,
        originalPrice: product.originalPrice || null,
        discount: product.discount || 0,
        discountType: 'percentage',
        weight: product.weight || null,
        image: product.image,
        lifeStage: product.lifeStage as 'cachorro' | 'gatito' | 'adulto' | 'senior' | 'todos',
        breedSize: product.breedSize as 'pequeña' | 'mediana' | 'grande' | 'todos',
        stock: 50, // Stock inicial por defecto
        minStock: 10, // Stock mínimo por defecto
        status: 'active',
        tags: [], // Tags vacíos por defecto, se pueden agregar después
      };

      const result = await createProduct(productData);

      if (result.success) {
        successCount++;
        console.log(`✓ Producto migrado: ${product.name} (ID: ${result.id})`);
      } else {
        errorCount++;
        console.error(`✗ Error migrando producto: ${product.name}`, result.error);
      }

      // Pequeña pausa para evitar sobrecargar Firestore
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      console.error(`✗ Error inesperado migrando producto: ${product.name}`, error);
    }
  }

  console.log(`\nMigración completada:`);
  console.log(`  ✓ Exitosos: ${successCount}`);
  console.log(`  ✗ Errores: ${errorCount}`);

  return { success: successCount, errors: errorCount };
}

/**
 * Validar que la estructura de datos del JSON es correcta
 */
export function validateProductsData(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!productsData.products || !Array.isArray(productsData.products)) {
    errors.push('products.json no contiene un array de productos');
    return { valid: false, errors };
  }

  productsData.products.forEach((product, index) => {
    const requiredFields = ['name', 'brand', 'category', 'type', 'price', 'image', 'lifeStage', 'breedSize'];
    
    requiredFields.forEach((field) => {
      if (!(field in product)) {
        errors.push(`Producto ${index + 1} (${product.name || 'sin nombre'}): falta el campo '${field}'`);
      }
    });

    // Validar tipos
    if (product.category && !['dog', 'cat'].includes(product.category)) {
      errors.push(`Producto ${index + 1}: categoría inválida '${product.category}'`);
    }

    if (product.type && !['food', 'toy', 'cleaning', 'accessory'].includes(product.type)) {
      errors.push(`Producto ${index + 1}: tipo inválido '${product.type}'`);
    }

    if (product.price && typeof product.price !== 'number') {
      errors.push(`Producto ${index + 1}: precio debe ser un número`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Función principal para ejecutar la migración
 * Se puede llamar desde el navegador o desde un script Node.js
 */
export async function runMigration(): Promise<void> {
  console.log('=== Iniciando migración de productos ===\n');

  // Validar datos primero
  console.log('Validando estructura de datos...');
  const validation = validateProductsData();

  if (!validation.valid) {
    console.error('Errores de validación encontrados:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\nMigración cancelada debido a errores de validación.');
    return;
  }

  console.log('✓ Validación exitosa\n');

  // Ejecutar migración
  const result = await migrateProducts();

  console.log('\n=== Migración finalizada ===');
  if (result.errors === 0) {
    console.log('✓ Todos los productos se migraron exitosamente');
  } else {
    console.log(`⚠ Se encontraron ${result.errors} errores durante la migración`);
  }
}

// Si se ejecuta directamente (Node.js), ejecutar la migración
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runMigration().catch((error) => {
    console.error('Error fatal durante la migración:', error);
    process.exit(1);
  });
}

