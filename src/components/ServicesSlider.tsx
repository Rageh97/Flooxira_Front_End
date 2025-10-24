"use client";
import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ExternalLink, Package, Search, Star, X } from "lucide-react";
import { getAllActiveServices, incrementServiceClick, type Service } from "@/lib/api";

export default function ServicesSlider() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: filteredServices.length > 6, // Only loop if more than 6 services
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
    skipSnaps: false,
    dragFree: false,
    watchDrag: true,
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else if (filteredServices.length > 6) {
        // Only loop back if we have more than 6 services
        emblaApi.scrollTo(0);
      }
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(autoplay);
  }, [emblaApi, filteredServices.length]);

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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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
      <CardHeader className="flex items-center justify-between bg-dark-custom rounded-lg mb-3 border-none">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Package className="h-5 w-5 " />
        <h3 className="text-white text-3xl font-bold"> خدمات التجار</h3>
            {/* Categories Filter */}
            {categories.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* <span className="text-sm text-white font-medium">التصنيفات:</span> */}
                <Button
                  size="sm"
                  variant={selectedCategory === null ? "default" : "secondary"}
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? "bg-light-custom border-1 border-green-500 " : "bg-white text-black "}
                >
                  الكل ({allServices.length})
                </Button>
                {categories.map((category) => {
                  const count = allServices.filter(s => s.category === category).length;
                  return (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? "default" : "secondary"}
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-light-custom border-1 border-green-500" : "bg-white text-black "}
                    >
                      {category} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardTitle>
       
        <div className="relative ">
          {!showSearchInput ? (
            // <button
            //   onClick={() => setShowSearchInput(true)}
            //   className="flex items-center justify-center w-full h-10 bg-gray-800/50 border border-gray-600 rounded-md hover:bg-gray-700/50 transition-colors"
            // >
            //   <img  src="/search.gif" className="w-6 h-6" />
            // </button>
            <img onClick={() => setShowSearchInput(true)} src="/search.gif" className="w-10 h-10 border border-text-primary p-1 rounded-full" />
          ) : (
            <div className="relative">
              {/* <img src="/search.gif" className="absolute right-3 w-6 h-6 top-1/2 -translate-y-1/2" /> */}
              <Input
                type="text"
                placeholder="ابحث عن خدمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 pl-10"
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
      </CardHeader>
      <div className="space-y-4 bg-none ">
        {/* Search and Filter Section */}
        <div className="space-y-3">
          {/* Search Bar */}
          {/* <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث عن خدمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div> */}

        

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
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {filteredServices.map((service, idx) => (
                  <div
                    key={service.id}
                    className="flex-shrink-0 pl-3 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/6"
                  >
                    <div className="h-full rounded-lg bg-secondry pt-1  hover:shadow-lg transition-all duration-300 cursor-pointer  hover:border-purple-300">
                      <div className="p-0 rounded-lg">
                        {/* Service Image */}
                        {service.image && (
                          <div className="relative w-full h-full overflow-hidden rounded-lg">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${service.image}`}
                              alt={service.title}
                              className="w-full h-full "
                            />
                            {service.category && (
                              <div className="absolute top-1 right-1  text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {/* {service.category} */}
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
                        <div className="p-3 space-y-2 ">
                          <div >
                            <h3 className="font-bold text-center text-lg text-white mb-0.5 line-clamp-1">
                              {service.title}
                            </h3>
                            <div className="flex flex-col justify-center items-center">
                              <span className="text-2xl font-bold text-primary">
                                {service.price} <span className="text-[9px] text-white">{service.currency}</span> 
                              </span>
                            
                            </div>
                            {/* {service.description && (
                              <p className="text-xs text-gray-200 line-clamp-1">
                                {service.description}
                              </p>
                            )} */}
                          </div>

                          {/* Price and Stats */}
                          <div className="flex items-center justify-around text-xs">
                            
                            <div className="text-[10px] text-yellow-500 text-left">
                              <div>👁️ {service.clicksCount || 0}</div>
                            </div>
                          </div>

                          {/* Purchase Button */}
                          {/* <Button
                            onClick={() => handleServiceClick(service)}
                            disabled={!service.purchaseLink}
                            size="sm"
                            className="w-full bg-gradient-to-r from-bg-light-custom to-text-primary hover:from-purple-700 hover:to-pink-700 text-xs py-1.5 h-auto"
                          >
                            <ExternalLink className="h-3 w-3 ml-1" />
                            عرض الخدمة
                          </Button> */}
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
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            {filteredServices.length > 6 && (
              <>
                <Button
                  onClick={scrollPrev}
                  size="sm"
                  variant="secondary"
                  className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full shadow-lg bg-white hover:bg-black/60 w-10 h-10 p-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  onClick={scrollNext}
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
