import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const CategoryPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women' | 'all'>('all');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    hotDeal: false,
    discount: false,
  });

  useEffect(() => {
    if (categoryName) {
      loadProducts();
    }
  }, [categoryName, selectedGender, filters]);

  const normalizeCategory = (value: string) => {
    return value
      .split(' ')
      .map((segment) => {
        const trimmed = segment.trim();
        if (!trimmed) return '';
        if (/^[^a-zA-Z]+$/.test(trimmed)) {
          return trimmed;
        }
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      })
      .filter(Boolean)
      .join(' ');
  };

  const parsePrice = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Normalize category - capitalize first letter to match database
      const normalizedCategory = categoryName ? normalizeCategory(categoryName) : '';

      let minPrice = parsePrice(filters.minPrice);
      let maxPrice = parsePrice(filters.maxPrice);

      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        const temp = minPrice;
        minPrice = maxPrice;
        maxPrice = temp;
      }
      
      const result = await ProductService.getProducts({
        category: categoryName,
        minPrice,
        maxPrice,
        hotDeal: filters.hotDeal || undefined,
        discount: filters.discount || undefined,
      });
      
      // Filter by gender if category is Clothing, Shoes, or Sports
      let filteredProducts = result;
      if (['Clothing', 'Shoes', 'Sports'].includes(normalizedCategory) && selectedGender !== 'all') {
        filteredProducts = result.filter(p => p.gender === selectedGender || p.gender === 'unisex');
      }

      if (minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => Number(product.price || 0) >= minPrice!);
      }

      if (maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(product => Number(product.price || 0) <= maxPrice!);
      }

      if (filters.hotDeal) {
        filteredProducts = filteredProducts.filter(product => product.isHotDeal === true);
      }

      if (filters.discount) {
        filteredProducts = filteredProducts.filter(product => Number(product.discount || 0) > 0);
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const showGenderTabs = categoryName && ['clothing', 'shoes', 'sports'].includes(categoryName.toLowerCase());
  const displayCategory = categoryName ? normalizeCategory(categoryName) : '';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{displayCategory}</h1>

      <div className="flex gap-6">
        {/* Compact Filters */}
        <div className="w-48 flex-shrink-0">
          <Card className="sticky top-20">
            <CardContent className="p-3 space-y-3">
              <h3 className="text-sm font-semibold mb-3">Filters</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Min Price</Label>
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Price</Label>
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="1000"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="hotDeal"
                    checked={filters.hotDeal}
                    onChange={(e) => setFilters({ ...filters, hotDeal: e.target.checked })}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="hotDeal" className="text-xs">Hot Deals</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="discount"
                    checked={filters.discount}
                    onChange={(e) => setFilters({ ...filters, discount: e.target.checked })}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="discount" className="text-xs">With Discount</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {showGenderTabs ? (
            <Tabs value={selectedGender} onValueChange={(value) => setSelectedGender(value as 'men' | 'women' | 'all')}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="men">Men</TabsTrigger>
                <TabsTrigger value="women">Women</TabsTrigger>
              </TabsList>
              <TabsContent value={selectedGender} className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={(p) => navigate(`/product/${p.id}`)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={(p) => navigate(`/product/${p.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;

