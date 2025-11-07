import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { Card, CardContent } from '../components/ui/card';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Load products for favorite IDs
      const products = await Promise.all(
        favoriteIds.map((id: string) => ProductService.getProduct(id))
      );
      
      setFavorites(products.filter(p => p !== null) as Product[]);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-8 w-8 text-red-500" />
        <h1 className="text-3xl font-bold">My Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No favorite products yet</p>
            <p className="text-sm text-muted-foreground">
              Start adding products to your favorites by clicking the heart icon
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(p) => navigate(`/product/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

