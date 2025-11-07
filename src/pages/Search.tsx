import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import { UserService } from '../services/userService';
import ProductCard from '../components/ProductCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search as SearchIcon, Store } from 'lucide-react';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const storeName = searchParams.get('store') || '';
  const hotDeals = searchParams.get('hot-deals');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  const [storeSearchTerm, setStoreSearchTerm] = useState(storeName);
  const [currentStoreName, setCurrentStoreName] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, [query, storeName, hotDeals]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (hotDeals) {
        filters.hotDeal = true;
      }
      
      let result: Product[];
      
      // If searching by store name
      if (storeName) {
        const sellers = await UserService.searchSellersByBusinessName(storeName);
        if (sellers.length > 0) {
          // Get products from all matching sellers
          const allProducts: Product[] = [];
          for (const seller of sellers) {
            try {
              const sellerProducts = await ProductService.getProductsBySeller(seller.id);
              allProducts.push(...sellerProducts);
            } catch (error) {
              console.error(`Error loading products for seller ${seller.id}:`, error);
            }
          }
          result = allProducts;
          // Set the first matching store name for display
          if (sellers.length > 0) {
            setCurrentStoreName(sellers[0].businessName);
          }
        } else {
          result = [];
          setCurrentStoreName('');
        }
      } else if (query) {
        // Regular product search
        result = await ProductService.searchProducts(query, filters);
        setCurrentStoreName('');
      } else {
        // No search, just get products
        result = await ProductService.getProducts(filters);
        setCurrentStoreName('');
      }
      setProducts(result);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setCurrentStoreName('');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleStoreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeSearchTerm.trim()) {
      navigate(`/search?store=${encodeURIComponent(storeSearchTerm.trim())}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Local search bars (mobile only) */}
      <div className="flex flex-col items-stretch gap-4 md:hidden">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <form onSubmit={handleStoreSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by store name..."
              value={storeSearchTerm}
              onChange={(e) => setStoreSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">Search Store</Button>
        </form>
      </div>

      {query && (
        <h2 className="text-2xl font-bold">
          Search results for "{query}" ({products.length} found)
        </h2>
      )}

      {storeName && (
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          Products from "{currentStoreName || storeName}" ({products.length} found)
        </h2>
      )}

      {hotDeals && !query && !storeName && (
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-red-500">🔥</span> Hot Deals
        </h2>
      )}

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
  );
};

export default Search;

