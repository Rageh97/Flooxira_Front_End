'use client';

import React, { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';

interface Banner {
  id: number;
  title: string;
  description?: string;
  image?: string;
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
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    // Update autoplay delay when slide changes
    if (swiperRef.current && autoPlay) {
      const swiper = swiperRef.current;
      
      const updateDelay = () => {
        const currentIndex = swiper.realIndex;
        const currentBanner = banners[currentIndex];
        const delay = (currentBanner?.duration || 5) * 1000;
        
        if (swiper.params.autoplay && typeof swiper.params.autoplay !== 'boolean') {
          swiper.params.autoplay.delay = delay;
        }
      };

      swiper.on('slideChange', updateDelay);
      
      return () => {
        swiper.off('slideChange', updateDelay);
      };
    }
  }, [banners, autoPlay]);

  if (banners.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <Swiper
        modules={[Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        loop={banners.length > 1}
        autoplay={autoPlay && banners.length > 1 ? {
          delay: (banners[0]?.duration || 5) * 1000,
          disableOnInteraction: false,
        } : false}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="rounded-2xl shadow-2xl w-full"
        style={{ width: '100%' }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div
              className="relative w-full h-full overflow-hidden cursor-pointer"
             
              onClick={() => banner.link && window.open(banner.link, '_blank')}
            >
              {/* Background Image */}
              {banner.image && (
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full"
                />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default AnimatedBanner;
