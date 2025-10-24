"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ChartData {
  month: string;
  revenue: number;
  users: number;
  messages: number;
}

interface RevenueChartProps {
  data: ChartData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxUsers = Math.max(...data.map(d => d.users));
  const maxMessages = Math.max(...data.map(d => d.messages));

  return (
    <Card className="bg-card border-none content-card">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center">
          <TrendingUp className="w-5 h-5 ml-2" />
          تحليل الإيرادات الشهرية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div>
            <h4 className="text-white font-semibold mb-4">الإيرادات</h4>
            <div className="flex items-end gap-4 h-32">
              {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-bg-semidark-custom rounded-t-lg relative">
                    <div 
                      className="bg-gradient-to-t from-text-primary to-bg-light-custom rounded-t-lg transition-all duration-500 hover:from-text-primary/80 hover:to-bg-light-custom/80"
                      style={{ 
                        height: `${(item.revenue / maxRevenue) * 100}%`,
                        minHeight: '8px'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                  <span className="text-xs text-text-primary font-bold">
                    {new Intl.NumberFormat('ar-SA', {
                      style: 'currency',
                      currency: 'SAR',
                      minimumFractionDigits: 0
                    }).format(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Users Chart */}
          <div>
            <h4 className="text-white font-semibold mb-4">المستخدمون</h4>
            <div className="flex items-end gap-4 h-32">
              {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-bg-semidark-custom rounded-t-lg relative">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-500/80 hover:to-blue-400/80"
                      style={{ 
                        height: `${(item.users / maxUsers) * 100}%`,
                        minHeight: '8px'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                  <span className="text-xs text-blue-400 font-bold">
                    {item.users.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Chart */}
          <div>
            <h4 className="text-white font-semibold mb-4">الرسائل</h4>
            <div className="flex items-end gap-4 h-32">
              {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-bg-semidark-custom rounded-t-lg relative">
                    <div 
                      className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-500 hover:from-orange-500/80 hover:to-orange-400/80"
                      style={{ 
                        height: `${(item.messages / maxMessages) * 100}%`,
                        minHeight: '8px'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                  <span className="text-xs text-orange-400 font-bold">
                    {item.messages.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
























