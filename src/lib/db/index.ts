/**
 * Exportaciones centralizadas de todas las funciones de base de datos
 * Todas las funciones funcionan client-side
 */

// Tipos
export * from './types';

// Productos
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  adjustStock,
  validateStockMultiple,
  validateAndAdjustStockMultiple,
} from './products';

// Usuarios y Direcciones
export {
  getUser,
  getUserByEmail,
  createUser,
  createUserWithId,
  updateUser,
  getAllUsers,
  deleteUser,
  getUserAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './users';

// Pedidos
export {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  getOrdersByStatus,
  getAllOrders,
} from './orders';

// Favoritos
export {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  clearFavorites,
} from './favorites';

// Carrito
export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
} from './cart';

// Métodos de Pago
export {
  getPaymentMethods,
  getPaymentMethod,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
} from './payment';

// Opciones de Productos (Categorías, Tipos, etc.)
export {
  getProductOptions,
  getAllProductOptions,
  getCategories,
  getProductTypes,
  getLifeStages,
  getBreedSizes,
  getProductOptionById,
  getProductOptionBySlug,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  permanentlyDeleteProductOption,
  reorderProductOptions,
  initializeDefaultOptions,
} from './productOptions';

// Inicialización y Migración
export {
  initializeDatabase,
  testConnection,
  runInitialization,
} from './init';

export {
  migrateProducts,
  validateProductsData,
  runMigration,
} from './migrate';

