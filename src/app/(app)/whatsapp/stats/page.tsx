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
          <Card className="bg-card border-none">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-500">{botStats.totalMessages}</div>
              <p className="text-xs text-primary">Total Messages</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-none">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{botStats.totalContacts}</div>
              <p className="text-xs text-primary">Total Contacts</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-none">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-500">{botStats.incomingMessages}</div>
              <p className="text-xs text-primary">Incoming Messages</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-none">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-500">{botStats.outgoingMessages}</div>
              <p className="text-xs text-primary">Bot Responses</p>
            </CardContent>
          </Card>
        </div>
      )}

      {botStats && (
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">Response Sources</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Knowledge Base</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(botStats.knowledgeBaseResponses / botStats.outgoingMessages) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-white">{botStats.knowledgeBaseResponses}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">OpenAI</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(botStats.openaiResponses / botStats.outgoingMessages) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-white">{botStats.openaiResponses}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Fallback</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ width: `${(botStats.fallbackResponses / botStats.outgoingMessages) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-white">{botStats.fallbackResponses}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}