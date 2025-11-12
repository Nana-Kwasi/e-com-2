import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/ui/tabs';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [hotDeals, setHotDeals] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [activeProductTab, setActiveProductTab] = useState<'featured' | 'new' | 'hot'>('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const [allProducts, hotDealProducts] = await Promise.all([
          ProductService.getProducts({}, undefined),
          ProductService.getProducts({ hotDeal: true }, undefined)
        ]);

        const newArrivals = deriveNewArrivals(allProducts);
        const featured = deriveFeaturedProducts(allProducts, hotDealProducts);

        setProducts(newArrivals);
        setFeaturedProducts(featured);
        setHotDeals(hotDealProducts.slice(0, 10));
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setFeaturedProducts([]);
        setHotDeals([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const deriveNewArrivals = (allProducts: Product[]) => {
    return allProducts.slice(0, 10);
  };

  const deriveFeaturedProducts = (allProducts: Product[], hotDealProducts: Product[]) => {
    if (!allProducts.length) return [];

    const hotDealIds = new Set(hotDealProducts.map((product) => product.id));

    const withScores = allProducts.map((product) => {
      const discount = typeof product.discount === 'number'
        ? product.discount
        : parseFloat(String(product.discount ?? '0')) || 0;
      const rating = typeof product.rating === 'number' ? product.rating : 0;
      const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0;
      const createdAt = normalizeDate(product.createdAt);

      let score = 0;
      if (hotDealIds.has(product.id)) score += 3;
      if (discount > 0) score += 2;
      if (rating >= 4.5) score += 1;
      if (reviewCount >= 500) score += 1;

      return { product, score, createdAt };
    });

    const scored = withScores
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .map((entry) => entry.product);

    if (scored.length > 0) {
      return scored.slice(0, 10);
    }

    const fallback = [...withScores]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((entry) => entry.product);

    return fallback.slice(0, 10);
  };

  const normalizeDate = (value: any): Date => {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
    }
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') {
        return value.toDate();
      }
      if (typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
      }
    }
    return new Date(0);
  };

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

      {/* Categories & Product Tabs */}
      <Tabs
        value={activeProductTab}
        onValueChange={(value) => setActiveProductTab(value as 'featured' | 'new' | 'hot')}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold mb-4">Categories</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <Select onValueChange={(value) => navigate(`/category/${value}`)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Browse categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => {
                  const slug = category.toLowerCase();
                  return (
                    <SelectItem key={slug} value={slug}>
                      {category}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <TabsList className="grid w-full grid-cols-2 md:w-auto md:flex md:gap-2">
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="new">New Arrivals</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="featured" className="space-y-4">
          <div className="flex justify_between items-center">
            <h3 className="text-xl font-semibold">Featured Picks</h3>
            <Button variant="ghost" onClick={() => navigate('/all-products')}>
              View All
            </Button>
          </div>
          {featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No featured products yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={(p) => navigate(`/product/${p.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">New Arrivals</h3>
            <Button variant="ghost" onClick={() => navigate('/all-products')}>
              View All
            </Button>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products found.
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

      {/* Additional modules can be added below */}
    </div>
  );
};

export default Home;
