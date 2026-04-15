/**
 * Carga inicial del catálogo en /products: categorías + opcionalmente todas las marcas en paralelo
 * (cuando hay ?brand= se ahorra una ronda secuencial a Firestore).
 */

export type CategoriesQueryResult = Awaited<
  ReturnType<typeof import('../../db/categories').getCategories>
>;
export type BrandsQueryResult = Awaited<ReturnType<typeof import('../../db/brands').getBrands>>;

export async function loadCategoriesAndOptionalBrandsParallel(options: {
  prefetchAllBrands: boolean;
}): Promise<{
  allCategoriesResult: CategoriesQueryResult;
  brandsPrefetchResult: BrandsQueryResult | { data: [] };
}> {
  const { getCategories } = await import('../../db/categories');
  const { getBrands } = await import('../../db/brands');

  if (!options.prefetchAllBrands) {
    const allCategoriesResult = await getCategories();
    return { allCategoriesResult, brandsPrefetchResult: { data: [] } };
  }

  const [allCategoriesResult, brandsPrefetchResult] = await Promise.all([
    getCategories(),
    getBrands(),
  ]);

  return { allCategoriesResult, brandsPrefetchResult };
}
