import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [hotDeals, setHotDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const [allProducts, hotDealProducts, newProducts] = await Promise.all([
          ProductService.getProducts({}, undefined),
          ProductService.getProducts({ hotDeal: true }, undefined),
          ProductService.getProducts({}, undefined) // New products (sorted by createdAt desc)
        ]);
        setProducts(newProducts.slice(0, 10)); // Show more new products
        setHotDeals(hotDealProducts.slice(0, 10)); // Show more hot deals
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setHotDeals([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const categories = [
    'Electronics', 'Clothing', 'Shoes', 'Food', 'Home & Garden',
    'Sports', 'Books', 'Beauty', 'Automotive'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="relative text-white border-0 overflow-hidden h-[350px] md:h-[400px]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/back2.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <CardContent className="relative p-12 md:p-16 text-center z-10 flex flex-col justify-center h-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Amansan-Shop</h1>
          <p className="text-xl mb-6 opacity-90">
            Discover amazing products at unbeatable prices
          </p>
          <Button
            onClick={() => navigate('/all-products')}
            className="bg-white text-gray-900 hover:bg-gray-50 border-2 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-base font-semibold rounded-lg"
          >
            Shop Now
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-4 py-2 text-base"
              onClick={() => navigate(`/category/${category.toLowerCase()}`)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hot Deals Carousel */}
      {hotDeals.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-red-500">🔥</span> Hot Deals
            </h2>
            <Button variant="ghost" onClick={() => navigate('/search?hot-deals=true')}>
              View All
            </Button>
          </div>
          <ProductCarousel products={hotDeals} />
        </div>
      )}

      {/* New Products */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">New Products</h2>
          <Button variant="ghost" onClick={() => navigate('/all-products')}>
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(p) => navigate(`/product/${p.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
