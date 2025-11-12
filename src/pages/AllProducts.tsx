import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const AllProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    hotDeal: false,
    discount: false,
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const parsePrice = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      let minPrice = parsePrice(filters.minPrice);
      let maxPrice = parsePrice(filters.maxPrice);

      // Handle inverted ranges by swapping values
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        const temp = minPrice;
        minPrice = maxPrice;
        maxPrice = temp;
      }

      const result = await ProductService.getProducts({
        minPrice,
        maxPrice,
        hotDeal: filters.hotDeal || undefined,
        discount: filters.discount || undefined,
      });

      setProducts(result);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Products</h1>

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
        </div>
      </div>
    </div>
  );
};

export default AllProducts;

