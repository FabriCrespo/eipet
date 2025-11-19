/**
 * Script de inicialización de la base de datos
 * Ejecutar una vez para configurar datos por defecto
 * Todas las funciones funcionan client-side
 */

import { initializeDefaultOptions } from './productOptions';
import { validateProductsData, runMigration } from './migrate';

/**
 * Inicializar la base de datos con datos por defecto
 * Ejecutar esto una vez al configurar el proyecto
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  optionsInitialized: boolean;
  productsMigrated: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let optionsInitialized = false;
  let productsMigrated = false;

  console.log('=== Inicializando Base de Datos ===\n');

  // 1. Inicializar opciones por defecto (categorías, tipos, etc.)
  console.log('1. Inicializando opciones por defecto...');
  try {
    const optionsResult = await initializeDefaultOptions();
    if (optionsResult.success) {
      optionsInitialized = true;
      console.log('✓ Opciones por defecto inicializadas correctamente\n');
    } else {
      errors.push('Error al inicializar opciones por defecto: ' + optionsResult.error?.message);
      console.error('✗ Error al inicializar opciones:', optionsResult.error);
    }
  } catch (error) {
    errors.push('Error inesperado al inicializar opciones: ' + (error as Error).message);
    console.error('✗ Error inesperado:', error);
  }

  // 2. Validar datos de productos antes de migrar
  console.log('2. Validando datos de productos...');
  try {
    const validation = validateProductsData();
    if (!validation.valid) {
      errors.push('Errores de validación en products.json:');
      validation.errors.forEach((error) => errors.push(`  - ${error}`));
      console.error('✗ Errores de validación encontrados:');
      validation.errors.forEach((error) => console.error(`  - ${error}`));
    } else {
      console.log('✓ Validación exitosa\n');
    }
  } catch (error) {
    errors.push('Error al validar productos: ' + (error as Error).message);
    console.error('✗ Error al validar:', error);
  }

  // 3. Migrar productos (solo si la validación fue exitosa)
  if (errors.length === 0) {
    console.log('3. Migrando productos...');
    try {
      await runMigration();
      productsMigrated = true;
      console.log('✓ Migración de productos completada\n');
    } catch (error) {
      errors.push('Error al migrar productos: ' + (error as Error).message);
      console.error('✗ Error al migrar:', error);
    }
  } else {
    console.log('⚠ Saltando migración de productos debido a errores de validación\n');
  }

  console.log('=== Inicialización Completada ===');
  if (errors.length === 0) {
    console.log('✓ Base de datos inicializada correctamente');
  } else {
    console.log('⚠ Se encontraron algunos errores:');
    errors.forEach((error) => console.log(`  - ${error}`));
  }

  return {
    success: errors.length === 0,
    optionsInitialized,
    productsMigrated,
    errors,
  };
}

/**
 * Verificar conexión con Firestore
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { db } = await import('../firebase');
    const { collection, getDocs, query, limit } = await import('firebase/firestore');
    
    // Intentar leer una colección (con límite de 1 para ahorrar recursos)
    const testRef = collection(db, 'products');
    const q = query(testRef, limit(1));
    await getDocs(q);
    
    console.log('✓ Conexión con Firestore exitosa');
    return true;
  } catch (error) {
    console.error('✗ Error de conexión con Firestore:', error);
    return false;
  }
}

/**
 * Función principal para ejecutar la inicialización
 * Se puede llamar desde el navegador o desde un script Node.js
 */
export async function runInitialization(): Promise<void> {
  console.log('Iniciando proceso de inicialización de la base de datos...\n');

  // Verificar conexión primero
  console.log('Verificando conexión con Firestore...');
  const connected = await testConnection();
  if (!connected) {
    console.error('\n✗ No se pudo conectar con Firestore. Verifica tu configuración.');
    return;
  }
  console.log('');

  // Ejecutar inicialización
  const result = await initializeDatabase();

  if (result.success) {
    console.log('\n✅ ¡Base de datos inicializada correctamente!');
  } else {
    console.log('\n⚠️  La inicialización se completó con algunos errores.');
    console.log('Revisa los errores arriba y corrige los problemas.');
  }
}

// Si se ejecuta directamente (Node.js), ejecutar la inicialización
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runInitialization().catch((error) => {
    console.error('Error fatal durante la inicialización:', error);
    process.exit(1);
  });
}

