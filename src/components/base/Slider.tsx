import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import { Grid } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/pagination';
import { SwiperOptions } from 'swiper/types';

interface SliderProps {
  items: ANY[];
  renderItem: (item: ANY) => React.ReactNode;
  className?: string;
  itemsPerSlide?: number;
  spaceBetween?: number;
}

export function Slider({
  items,
  renderItem,
  className = '',
  itemsPerSlide = 3,
  spaceBetween,
}: SliderProps) {
  const swiperRef = useRef<ANY>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const swipersSettings: SwiperOptions = {
    spaceBetween: spaceBetween || 16,
    slidesPerGroup: 1,
    slidesPerView: 1,
    touchStartPreventDefault: false,
    simulateTouch: true,
    grid: {
      rows: 1,
      fill: 'row',
    },
    modules: [Grid],

    breakpoints: {
      769: {
        grid: {
          rows: 2,
          fill: 'row',
        },
        slidesPerGroup: 2,
        slidesPerView: 2,
      },
      1025: {
        grid: {
          rows: 2,
          fill: 'row',
        },
        slidesPerGroup: itemsPerSlide,
        slidesPerView: itemsPerSlide,
      },
    },
  };

  return (
    <div className={`relative ${className}`}>
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => setCurrentPage(swiper.activeIndex + 1)}
        {...swipersSettings}
      >
        {items.map((item, index) => (
          <SwiperSlide key={index}>{renderItem(item)}</SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute inset-y-0 -left-11 -right-11 flex items-center justify-between pointer-events-none z-1000">
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg hover:bg-gray-50 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>

        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg hover:bg-gray-50 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {items.length > 1 && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm rounded-full px-4 py-1 text-sm font-medium text-gray-700">
            {currentPage} из {items.length}
          </div>
        </div>
      )}
    </div>
  );
}
