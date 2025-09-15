"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLinkedInCompanies } from "@/lib/api";

interface LinkedInCompaniesProps {
  onMessage: (message: string) => void;
}

export default function LinkedInCompanies({ onMessage }: LinkedInCompaniesProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await getLinkedInCompanies(token);
      if (res.ok) {
        setCompanies(res.companies || []);
      } else {
        onMessage(res.message || 'Failed to load companies');
      }
    } catch (e) {
      onMessage('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Company Pages</h2>
            <Button size="sm" variant="outline" onClick={loadCompanies} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No company pages found</p>
              <p className="text-sm text-gray-400 mt-2">
                You need to be an administrator of a LinkedIn company page to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company, index) => (
                <div key={company.organizationalTarget || index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {company.organizationalTarget || 'Unknown Company'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Role: {company.role || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        State: {company.state || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {company.role === 'ADMINISTRATOR' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Company Page Information</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Company Pages:</strong> This section shows LinkedIn company pages where you have administrative access. 
              You can post content and manage these pages through the LinkedIn API.
            </p>
            <p>
              <strong>Requirements:</strong> To see company pages here, you must be an administrator of the company page 
              and have granted the necessary permissions during the OAuth flow.
            </p>
            <p>
              <strong>Permissions:</strong> Company page management requires additional LinkedIn API permissions 
              that may need to be requested separately from LinkedIn.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





