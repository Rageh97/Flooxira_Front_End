"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFacebookPages, selectFacebookPage, getInstagramAccounts, selectInstagramAccount } from "@/lib/api";

interface FacebookPage {
  id: string;
  name: string;
  accessToken?: string;
  hasInstagram?: boolean;
  instagramAccount?: {
    id: string;
    username: string;
  };
}

interface InstagramAccount {
  pageId: string;
  pageName: string;
  instagramId: string;
  username: string;
  mediaCount: number;
  pageAccessToken: string;
}

interface FacebookPageSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function FacebookPageSelection({ isOpen, onClose, onComplete }: FacebookPageSelectionProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedInstagram, setSelectedInstagram] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'pages' | 'instagram'>('pages');

  useEffect(() => {
    if (isOpen) {
      loadFacebookPages();
    }
  }, [isOpen]);

  const loadFacebookPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      console.log('Loading Facebook pages with token:', !!token);
      
      const response = await getFacebookPages(token);
      console.log('Facebook pages response:', response);
      
      if (response.pages) {
        console.log('Setting pages:', response.pages);
        setPages(response.pages);
      } else {
        console.log('No pages found in response');
      }
    } catch (error) {
      console.error('Error loading Facebook pages:', error);
      alert(`Error loading pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadInstagramAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      const response = await getInstagramAccounts(token);
      
      if (response.instagramAccounts) {
        setInstagramAccounts(response.instagramAccounts);
      }
    } catch (error) {
      console.error('Error loading Instagram accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelection = async (pageId: string) => {
    console.log('Page selection clicked:', pageId);
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      console.log('Token found:', !!token);
      
      const page = pages.find(p => p.id === pageId);
      console.log('Page found:', page);
      
      if (page) {
        console.log('Calling selectFacebookPage...');
        const result = await selectFacebookPage(token, pageId, page.name);
        console.log('selectFacebookPage result:', result);
        
        setSelectedPage(pageId);
        
        // Load Instagram accounts for this page
        console.log('Loading Instagram accounts...');
        await loadInstagramAccounts();
        setStep('instagram');
      }
    } catch (error) {
      console.error('Error selecting Facebook page:', error);
      alert(`Error selecting page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramSelection = async (instagramId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      const instagram = instagramAccounts.find(ig => ig.instagramId === instagramId);
      
      if (instagram) {
        await selectInstagramAccount(token, instagramId, instagram.username);
        setSelectedInstagram(instagramId);
        
        // Complete the setup
        onComplete();
        onClose();
      }
    } catch (error) {
      console.error('Error selecting Instagram account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipInstagram = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-center flex-1">
              {step === 'pages' ? 'اختر صفحة Facebook' : 'اختر حساب Instagram'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

        {step === 'pages' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              اختر الصفحة التي تريد النشر عليها
            </p>
            
            {/* Debug info */}
            <div className="text-xs text-gray-500 text-center">
              صفحات متاحة: {pages.length} | تحميل: {loading ? 'نعم' : 'لا'}
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">جاري تحميل صفحات Facebook...</p>
              </div>
            ) : pages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.map((page) => (
                  <div
                    key={page.id} 
                    className={`cursor-pointer transition-all border rounded-lg p-4 ${
                      selectedPage === page.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => {
                      console.log('Card clicked for page:', page.id);
                      handlePageSelection(page.id);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">👥</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary">{page.name}</h3>
                        <p className="text-sm text-gray-600">صفحة Facebook</p>
                        {page.hasInstagram && (
                          <p className="text-xs text-green-600">✓ مرتبط بحساب Instagram</p>
                        )}
                      </div>
                      {selectedPage === page.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-600 mb-4">لا توجد صفحات Facebook متاحة</p>
                <p className="text-sm text-gray-500">تأكد من أن لديك صفحات Facebook مرتبطة بحسابك</p>
              </div>
            )}
          </div>
        )}

        {step === 'instagram' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              اختر حساب Instagram المرتبط بصفحة Facebook
            </p>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">جاري تحميل حسابات Instagram...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {instagramAccounts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {instagramAccounts.map((instagram) => (
                      <div
                        key={instagram.instagramId} 
                        className={`cursor-pointer transition-all border rounded-lg p-4 ${
                          selectedInstagram === instagram.instagramId 
                            ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                            : 'hover:shadow-md border-gray-200'
                        }`}
                        onClick={() => {
                          console.log('Instagram card clicked:', instagram.instagramId);
                          handleInstagramSelection(instagram.instagramId);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">📷</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-primary">@{instagram.username}</h3>
                            <p className="text-sm text-gray-600">حساب Instagram</p>
                            <p className="text-xs text-gray-500">مرتبط بصفحة: {instagram.pageName}</p>
                            <p className="text-xs text-gray-500">{instagram.mediaCount} منشور</p>
                          </div>
                          {selectedInstagram === instagram.instagramId && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📷</div>
                    <p className="text-gray-600 mb-4">لا توجد حسابات Instagram مرتبطة</p>
                    <Button onClick={handleSkipInstagram} variant="outline">
                      تخطي Instagram
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

          <div className="flex justify-between pt-4">
            {step === 'instagram' && (
              <Button variant="outline" onClick={() => setStep('pages')}>
                ← العودة لاختيار الصفحة
              </Button>
            )}
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              {step === 'instagram' && instagramAccounts.length === 0 && (
                <Button onClick={handleSkipInstagram}>
                  تخطي Instagram
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}