import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ReviewService } from '../services/reviewService';
import { ProductService } from '../services/productService';
import { Product } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { OrderService } from '../services/orderService';

const Feedback: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productRating: 5,
    sellerRating: 5,
    comment: '',
    productId: productId || '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;
    try {
      const productData = await ProductService.getProduct(productId);
      setProduct(productData);
      setFormData(prev => ({ ...prev, productId }));
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.productId) {
      alert('Please select a product or log in to submit feedback');
      return;
    }

    try {
      setLoading(true);
      
      let isVerifiedPurchase = false;
      if (orderId) {
        try {
          const order = await OrderService.getOrder(orderId);
          if (order && order.buyerId === user.id) {
            isVerifiedPurchase = order.products.some(p => p.productId === formData.productId);
          }
        } catch (error) {
          console.error('Error checking order:', error);
        }
      }

      await ReviewService.createReview({
        productId: formData.productId,
        buyerId: user.id,
        buyerName: user.name,
        orderId: orderId || undefined,
        rating: formData.productRating,
        comment: formData.comment,
        sellerRating: formData.sellerRating,
        isVerifiedPurchase,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        if (orderId) {
          navigate('/orders');
        } else if (productId) {
          navigate(`/product/${productId}`);
        } else {
          navigate('/');
        }
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
            <p className="text-muted-foreground">Your feedback has been submitted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Leave a Review</h1>

      {product && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div>
                <p className="font-semibold">{product.title}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product & Seller Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!productId && (
              <div>
                <Label htmlFor="productId">Select Product</Label>
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  placeholder="Enter product ID"
                  required={!productId}
                />
              </div>
            )}

            <div>
              <Label>Product Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, productRating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= formData.productRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Seller Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, sellerRating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= formData.sellerRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Comment</Label>
              <textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background mt-2"
                placeholder="Share your experience..."
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (orderId) {
                    navigate('/orders');
                  } else if (productId) {
                    navigate(`/product/${productId}`);
                  } else {
                    navigate('/');
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
