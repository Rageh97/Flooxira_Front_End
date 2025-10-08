"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'overdue';
  amount?: number;
}

interface TimelineProps {
  events: TimelineEvent[];
  title: string;
}

export default function Timeline({ events, title }: TimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 bg-green-500/10';
      case 'pending':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'overdue':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-card border-none content-card">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center">
          <Calendar className="w-5 h-5 ml-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < events.length - 1 && (
                <div className="absolute left-6 top-8 w-0.5 h-16 bg-text-primary/20"></div>
              )}
              
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${getStatusColor(event.status)}`}>
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{event.title}</h4>
                    <span className="text-sm text-gray-400">{formatDate(event.date)}</span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{event.description}</p>
                  
                  {event.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary font-bold">
                        {formatCurrency(event.amount)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        event.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {event.status === 'completed' ? 'مكتملة' :
                         event.status === 'pending' ? 'معلقة' : 'متأخرة'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}






