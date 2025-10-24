'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  link?: string;
  buttonText?: string;
  backgroundColor: string;
  textColor: string;
  duration: number; // in seconds
}

interface AnimatedBannerProps {
  banners: Banner[];
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

const AnimatedBanner: React.FC<AnimatedBannerProps> = ({
  banners,
  autoPlay = true,
  showControls = true,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !emblaApi || banners.length <= 1) return;

    const autoplayInterval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000); // Auto advance every 5 seconds

    return () => clearInterval(autoplayInterval);
  }, [autoPlay, emblaApi, banners.length]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Embla Carousel */}
      <div className="overflow-hidden rounded-2xl shadow-2xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              {/* Banner Container */}
              <div
                className="relative w-full h-[300px] md:h-[400px] lg:h-[320px] overflow-hidden group cursor-pointer"
                style={{
                  background: banner.backgroundColor,
                }}
                onClick={() => banner.link && window.open(banner.link, '_blank')}
              >
                {/* Background Image */}
                {banner.image && (
                  <div className="absolute inset-0">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
                  </div>
                )}

                {/* Content */}
                {/* <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-8 md:px-12 lg:px-16">
                    <div className="max-w-2xl space-y-4">
                      <h2 
                        className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in"
                        style={{ color: banner.textColor }}
                      >
                        {banner.title}
                      </h2>
                      <p 
                        className="text-base md:text-xl lg:text-2xl leading-relaxed opacity-95 animate-fade-in animation-delay-200"
                        style={{ color: banner.textColor }}
                      >
                        {banner.description}
                      </p>
                      
                      {banner.buttonText && banner.link && (
                        <div className="animate-fade-in animation-delay-400">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(banner.link, '_blank');
                            }}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
                          >
                            {banner.buttonText}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showControls && banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl z-10 group"
            aria-label="Previous slide"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl z-10 group"
            aria-label="Next slide"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? 'w-8 h-3 bg-white shadow-lg'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/75 hover:scale-110'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimatedBanner;
