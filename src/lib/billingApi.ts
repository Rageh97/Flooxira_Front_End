const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface BillingAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  messagesSent: number;
  growthRate: number;
  conversionRate: number;
  churnRate: number;
  averageRevenuePerUser: number;
  postsStats: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
    failed: number;
  };
  whatsappStats: {
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
  };
  telegramStats: {
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  plan: string;
  description: string;
  paymentMethod: string;
}

export interface ChartData {
  month: string;
  revenue: number;
  users: number;
  messages: number;
}

export interface DistributionData {
  name: string;
  value: number;
  percentage: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'overdue';
  amount: number;
}

// Get billing analytics
export async function getBillingAnalytics(token: string, period: string = 'month'): Promise<{ success: boolean; analytics?: BillingAnalytics; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/analytics?period=${period}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get billing analytics error:', error);
    return { success: false, message: error.message };
  }
}

// Get invoices
export async function getInvoices(
  token: string, 
  options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ success: boolean; invoices?: Invoice[]; pagination?: any; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.search) params.append('search', options.search);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/billing/invoices?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return { success: false, message: error.message };
  }
}

// Get revenue chart data
export async function getRevenueChartData(token: string, months: number = 6): Promise<{ success: boolean; chartData?: ChartData[]; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/revenue-chart?months=${months}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get revenue chart data error:', error);
    return { success: false, message: error.message };
  }
}

// Get plan distribution
export async function getPlanDistribution(token: string): Promise<{ success: boolean; distribution?: DistributionData[]; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/plan-distribution`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get plan distribution error:', error);
    return { success: false, message: error.message };
  }
}

// Get payment method distribution
export async function getPaymentMethodDistribution(token: string): Promise<{ success: boolean; distribution?: DistributionData[]; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/payment-method-distribution`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get payment method distribution error:', error);
    return { success: false, message: error.message };
  }
}

// Get subscription timeline
export async function getSubscriptionTimeline(token: string): Promise<{ success: boolean; timeline?: TimelineEvent[]; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/timeline`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get subscription timeline error:', error);
    return { success: false, message: error.message };
  }
}






