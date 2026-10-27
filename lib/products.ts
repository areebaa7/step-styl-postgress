import { Prisma } from '@prisma/client';
import prisma from './prisma';
import type { Product } from '@prisma/client';
import type { ProductDTO } from '@/types/product';
import { products as seedProducts } from '@/app/data/products';

let seedPromise: Promise<void> | null = null;

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }
  return [];
};

const toObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      const obj: Record<string, unknown> = {};
      value.split('\n').forEach((line) => {
        const [k, ...v] = line.split(':');
        if (k && v.length) obj[k.trim()] = v.join(':').trim();
      });
      return obj;
    }
  }
  return {};
};

const toJsonInput = (value: unknown) => value as Prisma.InputJsonValue;

export function serializeProduct(product: any): ProductDTO {
  return {
    id: product.id,
    slug: product.slug,
    category: (product.category || 'casual').toLowerCase().trim(),
    gender: (product.gender || 'men').toLowerCase().trim(),
    title: product.title,
    description: product.description,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    salePrice: product.salePrice === null ? null : Number(product.salePrice),
    inStock: product.inStock,
    image: product.image ?? null,
    images: toArray(product.images),
    colors: toArray(product.colors),
    videoUrl: product.videoUrl ?? null,
    advantages: toArray(product.advantages),
    specifications: toObject(product.specifications),
    features: toArray(product.features),
    variants: Array.isArray(product.variants) ? product.variants : [],
    collectionId: product.collectionId ?? null,
    collection: product.collection ? {
      id: product.collection.id,
      name: product.collection.name,
      slug: product.collection.slug,
      description: product.collection.description,
      image: product.collection.image,
      targetGender: product.collection.targetGender ? product.collection.targetGender.toLowerCase() : 'unisex',
      createdAt: product.collection.createdAt.toISOString(),
      updatedAt: product.collection.updatedAt.toISOString(),
    } : null,
    rating: Number(product.rating || 0),
    saleCount: Number(product.saleCount || 0),
    discount: product.discount ?? null,
    stock_quantity: Array.isArray(product.variants)
      ? product.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
      : (product.inStock ? 10 : 0),
    isNew: (new Date().getTime() - new Date(product.createdAt).getTime()) < 15 * 24 * 60 * 60 * 1000,
    isTrending: Number(product.rating || 0) > 4.0 && Number(product.saleCount || 0) > 20,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function ensureProductsSeeded() {
  if (process.env.SEED_DEMO_PRODUCTS !== 'true') {
    return;
  }

  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const count = await prisma.product.count();
      if (count > 0) {
        return;
      }
      console.log("Use scripts/seed-products.js instead. Skipping old seed.");
    } catch (err) {
      console.error('Product seeding error:', err);
      seedPromise = null;
    }
  })();

  return seedPromise;
}

export async function resolveCollectionId(input: string | null | undefined): Promise<string | null> {
  if (!input || typeof input !== 'string' || input.trim() === '') return null;
  const trimmed = input.trim();
  
  try {
    // 1. Direct match on collection id
    const direct = await prisma.collection.findUnique({ where: { id: trimmed } });
    if (direct) return direct.id;

    // 2. Match by exact name or slug
    const matched = await prisma.collection.findFirst({
      where: {
        OR: [
          { name: { equals: trimmed } },
          { slug: { equals: trimmed.toLowerCase() } }
        ]
      }
    });
    if (matched) return matched.id;

    // 3. Fallback to default categories
    const defaults: Record<string, { name: string; slug: string; targetGender: 'MEN' | 'WOMEN' | 'KIDS' }> = {
      'men collection': { name: 'Men Collection', slug: 'men-collection', targetGender: 'MEN' },
      'men-collection': { name: 'Men Collection', slug: 'men-collection', targetGender: 'MEN' },
      'women collection': { name: 'Women Collection', slug: 'women-collection', targetGender: 'WOMEN' },
      'women-collection': { name: 'Women Collection', slug: 'women-collection', targetGender: 'WOMEN' },
      'kids collection': { name: 'Kids Collection', slug: 'kids-collection', targetGender: 'KIDS' },
      'kids-collection': { name: 'Kids Collection', slug: 'kids-collection', targetGender: 'KIDS' },
    };

    const def = defaults[trimmed.toLowerCase()];
    if (def) {
      const upserted = await prisma.collection.upsert({
        where: { slug: def.slug },
        update: {},
        create: {
          name: def.name,
          slug: def.slug,
          targetGender: def.targetGender,
        }
      });
      return upserted.id;
    }
  } catch (err) {
    console.warn('Could not resolve collection id:', err);
  }

  return null;
}
