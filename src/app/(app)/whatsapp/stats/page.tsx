"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getBotStats } from "@/lib/api";

export default function WhatsAppStatsPage() {
  const [botStats, setBotStats] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadBotStats();
    }
  }, [token]);

  async function loadBotStats() {
    try {
      const data = await getBotStats(token);
      if (data.success) {
        setBotStats(data.stats);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {botStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gradient-border border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="text-[50px] font-bold text-orange-500 ">{botStats.totalMessages}</div>
              <p className="text-lg  font-bold text-white">إجمالي الرسائل</p>
            </CardContent>
          </Card>
          <Card className="gradient-border border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="text-[50px] font-bold text-primary">{botStats.totalContacts}</div>
              <p className="text-lg  font-bold text-white">إجمالي جهات الاتصال</p>
            </CardContent>
          </Card>
          <Card className="gradient-border border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="text-[50px] font-bold text-yellow-500">{botStats.incomingMessages}</div>
              <p className="text-lg  font-bold text-white">الرسائل الواردة</p>
            </CardContent>
          </Card>
          <Card className="gradient-border border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="text-[50px] font-bold text-blue-500">{botStats.outgoingMessages}</div>
              <p className="text-lg  font-bold text-white">ردود البوت</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* {botStats && (
        <Card className="gradient-border border-none">
          <CardHeader className="border-text-primary/50 text-primary">مصادر الردود</CardHeader>
          <CardContent>
            <div className="space-y-4">
             
              <div className="flex  w-full ">
                <div className="w-1/4">
                <span className="text-sm font-medium text-white ">الذكاء الاصطناعي</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <div className="w-full bg-gray-900 rounded-full h-2 ">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(botStats.openaiResponses / botStats.outgoingMessages) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-white">{botStats.openaiResponses}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="w-1/4">
                <span className="text-sm font-medium text-white ">الرد الاحتياطي</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <div className="w-full bg-gray-900 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(botStats.fallbackResponses / botStats.outgoingMessages) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-white">{botStats.fallbackResponses}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}