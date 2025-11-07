import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
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
  }, [category, filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Normalize category - capitalize first letter to match database
      let normalizedCategory = category;
      if (category) {
        normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      }
      
      const result = await ProductService.getProducts({
        category: normalizedCategory || undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
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

  const categories = [
    'Electronics', 'Clothing', 'Shoes', 'Food', 'Home & Garden',
    'Sports', 'Books', 'Beauty', 'Automotive'
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Categories</h1>

      {/* Category Navigation - Sidebar style */}
      <div className="flex flex-col gap-1 mb-6">
        <Button
          variant={!category ? 'default' : 'ghost'}
          className="justify-start w-full"
          onClick={() => navigate('/categories')}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat.toLowerCase() ? 'default' : 'ghost'}
            className="justify-start w-full"
            onClick={() => navigate(`/categories?category=${cat.toLowerCase()}`)}
          >
            {cat}
          </Button>
        ))}
      </div>

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

        {/* Products Grid - 4-5 per row */}
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

export default Categories;

