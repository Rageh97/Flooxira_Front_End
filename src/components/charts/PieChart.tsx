"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
}

export default function PieChart({ data, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let cumulativePercentage = 0;

  return (
    <Card className="bg-card border-none content-card">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center">
          <PieChartIcon className="w-5 h-5 ml-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const startAngle = cumulativePercentage * 3.6;
                const endAngle = (cumulativePercentage + percentage) * 3.6;
                
                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                
                const largeArcFlag = percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M 50 50`,
                  `L ${x1} ${y1}`,
                  `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `Z`
                ].join(' ');

                cumulativePercentage += percentage;

                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={item.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">
                  {total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">إجمالي</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-text-primary font-bold">
                  {item.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  {((item.value / total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
























