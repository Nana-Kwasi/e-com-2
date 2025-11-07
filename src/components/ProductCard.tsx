import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    onViewDetails(product);
  };

  const getDiscountedPrice = () => {
    if (product.discount && product.discount > 0) {
      return product.price * (1 - product.discount / 100);
    }
    return product.price;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(price);
  };

  // Generate realistic default rating if not provided
  const getRating = () => {
    if (product.rating !== undefined) {
      return product.rating;
    }
    // Generate a realistic rating between 4.0 and 5.0
    return Math.round((Math.random() * 1.0 + 4.0) * 10) / 10;
  };

  // Generate realistic review count if not provided
  const getReviewCount = () => {
    if (product.reviewCount !== undefined) {
      return product.reviewCount;
    }
    // Generate realistic review count
    const counts = [100, 200, 500, 800, 1000, 1200];
    return counts[Math.floor(Math.random() * counts.length)];
  };

  const rating = getRating();
  const reviewCount = getReviewCount();

  // Render stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-3 w-3 fill-orange-400 text-orange-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-3 w-3 fill-orange-400 text-orange-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-3 w-3 fill-gray-200 text-gray-200" />
        );
      }
    }
    return stars;
  };

  // Format review count
  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg bg-gray-50 border-gray-200"
      onClick={() => onViewDetails(product)}
    >
      <CardContent className="p-0 relative">
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-white rounded-t-lg">
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          {/* Category Tag - Top Right */}
          <Badge 
            className="absolute top-2 right-2 bg-gray-100 text-gray-800 border-gray-300 text-xs font-normal"
            variant="outline"
          >
            {product.category}
          </Badge>
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          {/* Product Title */}
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 h-10 leading-tight">
            {product.title}
          </h3>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-0.5">
              {renderStars()}
            </div>
            <span className="text-xs font-semibold text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">({formatReviewCount(reviewCount)})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-gray-900">
              {formatPrice(getDiscountedPrice())}
            </span>
            {product.discount && product.discount > 0 && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              variant="outline"
              size="sm"
              className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100 text-xs py-2 h-8"
            >
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              size="sm"
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-xs py-2 h-8"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
