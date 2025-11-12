import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Minus, Plus, Star, MessageSquare } from 'lucide-react';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import { ReviewService, Review } from '../services/reviewService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import ProductCard from '../components/ProductCard';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (product) {
      loadFeaturedProducts();
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const loadReviews = async () => {
    if (!id) return;
    try {
      setLoadingReviews(true);
      const productReviews = await ReviewService.getProductReviews(id);
      setReviews(productReviews);
      const avg = await ReviewService.getProductAverageRating(id);
      setAverageRating(avg);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const result = await ProductService.getProduct(id!);
      setProduct(result);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    if (!product) return;
    
    try {
      setLoadingFeatured(true);
      const products = await ProductService.getProducts({ category: product.category });
      // Filter out current product and get up to 4 products from same category
      const filtered = products
        .filter(p => p.id !== product.id && p.isActive)
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

  const getDiscountedPrice = () => {
    if (product?.discount && product.discount > 0) {
      return product.price * (1 - product.discount / 100);
    }
    return product?.price || 0;
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:grid-rows-auto">
      <div>
        <div className="aspect-square w-full mb-4 rounded-lg overflow-hidden bg-muted">
          <img
            src={product.images[selectedImage] || product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square rounded-lg overflow-hidden border-2 ${
                  selectedImage === idx ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          {product.isHotDeal && (
            <Badge className="mb-2 bg-red-500">🔥 Hot Deal</Badge>
          )}
          {product.discount && product.discount > 0 && (
            <Badge className="mb-2 bg-green-500">{product.discount}% OFF</Badge>
          )}
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-bold text-primary">{formatPrice(getDiscountedPrice())}</span>
            {product.discount && product.discount > 0 && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-4">{product.description}</p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="font-semibold mb-2">Quantity</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, product.stock)))}
                  className="w-20 text-center"
                  min={1}
                  max={product.stock}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  ({product.stock} available)
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            <div className="pt-4 border-t space-y-2 text-sm">
              <p><span className="font-semibold">Category:</span> {product.category}</p>
              <p><span className="font-semibold">Stock:</span> {product.stock} units</p>
              
              {/* Additional Product Information */}
              {(product.brand || product.sku || product.model || product.weight || product.dimensions || 
                product.material || product.ingredients || product.warranty || product.condition || 
                product.size || product.color || product.author || product.pages || product.expirationDate) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold mb-3 text-base">Product Information</p>
                  <div className="grid grid-cols-1 gap-2">
                    {product.brand && (
                      <p><span className="font-semibold">Brand:</span> {product.brand}</p>
                    )}
                    {product.sku && (
                      <p><span className="font-semibold">SKU:</span> {product.sku}</p>
                    )}
                    {product.model && (
                      <p><span className="font-semibold">
                        {product.category === 'Books' ? 'ISBN:' : 'Model:'}
                      </span> {product.model}</p>
                    )}
                    {product.size && (
                      <p><span className="font-semibold">Size:</span> {product.size}</p>
                    )}
                    {product.color && (
                      <p><span className="font-semibold">Color:</span> {product.color}</p>
                    )}
                    {product.material && (
                      <p><span className="font-semibold">Material:</span> {product.material}</p>
                    )}
                    {product.weight && (
                      <p><span className="font-semibold">Weight:</span> {product.weight}</p>
                    )}
                    {product.dimensions && (
                      <p><span className="font-semibold">Dimensions:</span> {product.dimensions}</p>
                    )}
                    {product.ingredients && (
                      <p><span className="font-semibold">
                        {product.category === 'Food' ? 'Ingredients:' : 'Key Ingredients:'}
                      </span> {product.ingredients}</p>
                    )}
                    {product.warranty && (
                      <p><span className="font-semibold">Warranty:</span> {product.warranty}</p>
                    )}
                    {product.condition && (
                      <p><span className="font-semibold">Condition:</span> 
                        <span className="capitalize ml-1">{product.condition.replace('_', ' ')}</span>
                      </p>
                    )}
                    {product.author && (
                      <p><span className="font-semibold">Author:</span> {product.author}</p>
                    )}
                    {product.pages && (
                      <p><span className="font-semibold">Pages:</span> {product.pages}</p>
                    )}
                    {product.expirationDate && (
                      <p><span className="font-semibold">Expiration Date:</span> {
                        new Date(product.expirationDate).toLocaleDateString('en-GH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }</p>
                    )}
                  </div>
                </div>
              )}

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold mb-2">Specifications:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key}><span className="font-semibold">{key}:</span> {value}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Shipping and Return Policy */}
              {(product.shippingInfo || product.returnPolicy) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold mb-3 text-base">Shipping & Returns</p>
                  {product.shippingInfo && (
                    <p className="mb-2"><span className="font-semibold">Shipping:</span> {product.shippingInfo}</p>
                  )}
                  {product.returnPolicy && (
                    <p><span className="font-semibold">Return Policy:</span> {product.returnPolicy}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 col-span-1 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Reviews</h2>
          <div className="flex items-center gap-2">
            {averageRating > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
              </>
            )}
          </div>
        </div>

        {loadingReviews ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No reviews yet</p>
              {user && (
                <Button onClick={() => navigate(`/feedback?productId=${id}`)}>
                  Be the first to review
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {review.buyerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.buyerName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.isVerifiedPurchase && (
                              <Badge variant="secondary" className="text-xs">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Featured Products from Same Category */}
      {featuredProducts.length > 0 && (
        <div className="mt-12 col-span-1 lg:col-span-2">
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

export default ProductDetails;

