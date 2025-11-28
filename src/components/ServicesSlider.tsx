"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Eye, Package, X } from "lucide-react";
import { getAllActiveServices, incrementServiceClick, type Service } from "@/lib/api";

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

export default function ServicesSlider() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, selectedCategory, allServices]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await getAllActiveServices(1, 100); // Get up to 100 services
      setAllServices(res.services);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          res.services
            .map(s => s.category)
            .filter((c): c is string => !!c && c.trim() !== '')
        )
      ).sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...allServices];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const handleServiceClick = async (service: Service) => {
    try {
      await incrementServiceClick(service.id);
      if (service.purchaseLink) {
        window.open(service.purchaseLink, "_blank");
      }
    } catch (error) {
      console.error("Failed to increment click:", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600">جاري تحميل الخدمات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allServices.length === 0) {
    return null; // Don't show anything if no services
  }

  return (
    <div className=" border-none ">
      <CardHeader className="flex flex-col gap-4 gradient-border rounded-lg mb-1 border-none">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 " />
            <h3 className="text-white text-xl font-bold"> خدمات التجار</h3>
          </CardTitle>
         
          <div className="relative flex items-center gap-2">
             {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="relative">
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="appearance-none rounded-lg bg-fixed-40 text-white font-semibold px-6 py-1 pr-10 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none  min-w-[150px]"
              
            >
              <option value="" className="bg-secondry text-white rounded-lg">
                الكل ({allServices.length})
              </option>
              {categories.map((category) => {
                const count = allServices.filter(s => s.category === category).length;
                return (
                  <option 
                    key={category} 
                    value={category}
                    className="bg-secondry text-white rounded-lg"
                  >
                    {category} ({count})
                  </option>
                );
              })}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </div>
          </div>
        )}
            {!showSearchInput ? (
              <img onClick={() => setShowSearchInput(true)} src="/search.gif" className="w-10 h-10 border border-text-primary p-1 rounded-full cursor-pointer" />
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ابحث عن خدمة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-10 w-full md:w-64"
                  autoFocus
                />
                
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    setSearchTerm("");
                  }}
                  className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-200 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
             
          </div>
          
        </div>

      
      </CardHeader>
      <div className="space-y-4 bg-none ">
        {/* Search and Filter Section */}
        <div className="space-y-3">
          {/* Active Filters Info */}
          {(searchTerm || selectedCategory) && (
            <div className="flex items-center justify-between bg-purple-100 rounded-lg px-3 py-2">
              <span className="text-sm text-purple-800">
                {filteredServices.length} خدمة متاحة
                {searchTerm && ` • البحث: "${searchTerm}"`}
                {selectedCategory && ` • التصنيف: ${selectedCategory}`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="text-purple-700 hover:text-purple-900 hover:bg-purple-200"
              >
                <X className="h-4 w-4 ml-1" />
                مسح الفلاتر
              </Button>
            </div>
          )}
        </div>

        {/* Services Slider */}
        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium mb-1">لا توجد خدمات متاحة</p>
            <p className="text-sm text-gray-500">
              {searchTerm || selectedCategory ? "جرب تغيير معايير البحث" : "لم يتم إضافة خدمات بعد"}
            </p>
          </div>
        ) : (
          <div className="relative">
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={15}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 6 },
              }}
              loop={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              className="w-full"
            >
              {filteredServices.map((service) => (
                <SwiperSlide key={service.id} className="h-auto">
                  <div className="h-full rounded-lg  card-shine-effect pt-1 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-purple-300 flex flex-col">
                    <div className="p-0 rounded-lg flex flex-col h-full">
                      {/* Service Image */}
                      {service.image && (
                        <div className="relative w-full overflow-hidden rounded-lg flex-shrink-0">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${service.image}`}
                            alt={service.title}
                            className="w-full h-auto object-cover"
                          />
                          {service.category && (
                            <div className="absolute top-1 right-1 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                              <svg
                                fill="#ffdd00"
                                height="20px"
                                width="20px"
                                version="1.1"
                                id="Layer_1"
                                xmlns="http://www.w3.org/2000/svg"
                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                viewBox="0 0 329.942 329.942"
                                xmlSpace="preserve"
                                stroke="#ffdd00"
                              >
                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                  <path
                                    id="XMLID_16_"
                                    d="M329.208,126.666c-1.765-5.431-6.459-9.389-12.109-10.209l-95.822-13.922l-42.854-86.837 
                                    c-2.527-5.12-7.742-8.362-13.451-8.362c-5.71,0-10.925,3.242-13.451,8.362l-42.851,86.836l-95.825,13.922 
                                    c-5.65,0.821-10.345,4.779-12.109,10.209c-1.764,5.431-0.293,11.392,3.796,15.377l69.339,67.582L57.496,305.07 
                                    c-0.965,5.628,1.348,11.315,5.967,14.671c2.613,1.899,5.708,2.865,8.818,2.865c2.387,0,4.784-0.569,6.979-1.723l85.711-45.059 
                                    l85.71,45.059c2.208,1.161,4.626,1.714,7.021,1.723c8.275-0.012,14.979-6.723,14.979-15c0-1.152-0.13-2.275-0.376-3.352 
                                    l-16.233-94.629l69.339-67.583C329.501,138.057,330.972,132.096,329.208,126.666z"
                                  />
                                </g>
                              </svg>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Service Info */}
                      <div className="p-3 space-y-2 flex flex-col flex-grow justify-end">
                        <div>
                          <h3 className="font-bold text-center text-lg text-white mb-0.5 line-clamp-1">
                            {service.title}
                          </h3>
                          <div className="flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-primary">
                              {service.price} <span className="text-[9px] text-white">{service.currency}</span> 
                            </span>
                          </div>
                        </div>

                        {/* Price and Stats */}
                        <div className="flex items-center justify-around text-xs">
                          <div className="text-[10px] flex items-center gap-1 text-yellow-500 text-left">
                            <Eye className="w-4 h-4" /> {service.clicksCount || 0}
                          </div>
                        </div>

                        {/* Purchase Button */}
                        <button
                          onClick={() => handleServiceClick(service)}
                          disabled={!service.purchaseLink}
                          className="relative w-full h-10 active:scale-95 transistion overflow-hidden rounded-lg p-[1px] focus:outline-none "
                        >
                          <span
                            className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#08c47d_0%,#134a2b_50%,#08c47d_100%)]"
                          >
                          </span>
                          <span
                            className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[linear-gradient(to_right,var(--color-bg-light),var(--color-bg-dark))] px-7 text-sm font-medium text-white backdrop-blur-3xl gap-2 undefined"
                          >
                            عرض الخدمة
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              stroke-width="0"
                              viewBox="0 0 448 512"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M429.6 92.1c4.9-11.9 2.1-25.6-7-34.7s-22.8-11.9-34.7-7l-352 144c-14.2 5.8-22.2 20.8-19.3 35.8s16.1 25.8 31.4 25.8H224V432c0 15.3 10.8 28.4 25.8 31.4s30-5.1 35.8-19.3l144-352z"
                              ></path>
                            </svg>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation Buttons */}
            {filteredServices.length > 6 && (
              <>
                <Button
                  onClick={() => swiperRef.current?.slidePrev()}
                  size="sm"
                  variant="secondary"
                  className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full shadow-lg bg-white hover:bg-black/60 w-10 h-10 p-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => swiperRef.current?.slideNext()}
                  size="sm"
                  variant="secondary"
                  className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 rounded-full shadow-lg bg-white hover:bg-black/60 w-10 h-10 p-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
