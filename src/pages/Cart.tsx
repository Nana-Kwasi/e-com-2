import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import ProductCard from '../components/ProductCard';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoadingFeatured(true);
      const products = await ProductService.getProducts({});
      // Get random featured products (excluding items in cart)
      const cartProductIds = items.map(item => item.productId);
      const filtered = products
        .filter(p => !cartProductIds.includes(p.id) && p.isActive)
        .slice(0, 4);
      setFeaturedProducts(filtered);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-4">Add some products to get started</p>
        <Button onClick={() => navigate('/')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shopping Cart ({getTotalItems()} items)</h1>
        <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const discountedPrice = item.product.discount
              ? item.product.price * (1 - item.product.discount / 100)
              : item.product.price;
            const totalPrice = discountedPrice * item.quantity;

            return (
              <Card key={item.productId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.product.images[0] || '/placeholder-image.jpg'}
                      alt={item.product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.product.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.product.description}
                      </p>
                      {item.product.discount && item.product.discount > 0 && (
                        <Badge className="mb-2">{item.product.discount}% OFF</Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            updateQuantity(item.productId, Math.max(1, Math.min(newQuantity, item.product.stock)));
                          }}
                          className="w-20 text-center"
                          min={1}
                          max={item.product.stock}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-lg font-bold">{formatPrice(totalPrice)}</p>
                        {item.product.discount && item.product.discount > 0 && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
              <Button
                className="w-full mb-2"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((featuredProduct) => (
              <ProductCard
                key={featuredProduct.id}
                product={featuredProduct}
                onViewDetails={(p) => navigate(`/product/${p.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
