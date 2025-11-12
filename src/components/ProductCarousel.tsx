import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ 
  products, 
  title, 
  autoSlide = true,
  autoSlideInterval = 3000 
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const itemWidth = 280; // Fixed width for each product card
  const gap = 24; // Gap between items
  const itemsPerView = 5; // Show 5 products at a time

  const totalSlides = Math.ceil(products.length / itemsPerView);

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const scrollPosition = index * (itemWidth + gap) * itemsPerView;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  const nextSlide = () => {
    if (currentIndex < totalSlides - 1) {
      scrollToIndex(currentIndex + 1);
    } else {
      // Loop back to start
      scrollToIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    } else {
      // Loop to end
      scrollToIndex(totalSlides - 1);
    }
  };

  // Auto-slide functionality - works even with fewer products
  useEffect(() => {
    if (autoSlide && products.length > 0) {
      // For products less than itemsPerView, still auto-slide to show them in carousel
      if (products.length <= itemsPerView) {
        // Just scroll horizontally to show all products
        autoSlideRef.current = setInterval(() => {
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const currentScroll = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;
            
            if (currentScroll >= maxScroll - 10) {
              // Scroll back to start
              container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              // Scroll forward
              container.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
            }
          }
        }, autoSlideInterval);
      } else if (totalSlides > 1) {
        // Normal auto-slide for multiple slides
        autoSlideRef.current = setInterval(() => {
          nextSlide();
        }, autoSlideInterval);
      }

      return () => {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current);
        }
      };
    }
  }, [currentIndex, products.length, autoSlide, autoSlideInterval, totalSlides, itemsPerView, itemWidth, gap]);

  // Pause auto-slide on hover
  const handleMouseEnter = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (autoSlide && products.length > 0) {
      if (products.length <= itemsPerView) {
        autoSlideRef.current = setInterval(() => {
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const currentScroll = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;
            
            if (currentScroll >= maxScroll - 10) {
              container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              container.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
            }
          }
        }, autoSlideInterval);
      } else if (totalSlides > 1) {
        autoSlideRef.current = setInterval(() => {
          nextSlide();
        }, autoSlideInterval);
      }
    }
  };

  // Manual scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const newIndex = Math.round(scrollLeft / ((itemWidth + gap) * itemsPerView));
      setCurrentIndex(Math.min(newIndex, totalSlides - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [totalSlides, itemWidth, gap, itemsPerView]);

  if (products.length === 0) return null;

  return (
    <div 
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        {/* Navigation Buttons */}
        {products.length > itemsPerView && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="product-carousel-container scrollbar-hide"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            gap: `${gap}px`,
            paddingBottom: '1rem',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            width: '100%',
            position: 'relative',
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                flexShrink: 0,
                flexGrow: 0,
                width: `${itemWidth}px`,
                minWidth: `${itemWidth}px`,
                maxWidth: `${itemWidth}px`,
                scrollSnapAlign: 'start',
              }}
            >
              <ProductCard
                product={product}
                onViewDetails={(p) => navigate(`/product/${p.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slide indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
