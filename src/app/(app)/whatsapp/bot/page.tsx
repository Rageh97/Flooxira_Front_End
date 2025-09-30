"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  uploadKnowledgeBase, 
  getKnowledgeBase, 
  deleteKnowledgeEntry,
} from "@/lib/api";

export default function WhatsAppBotPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<{ id: number; keyword: string; answer: string; isActive: boolean }>>([]);
  const [file, setFile] = useState<File | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadKnowledgeBase();
    }
  }, [token]);

  async function loadKnowledgeBase() {
    try {
      const data = await getKnowledgeBase(token);
      if (data.success) {
        setKnowledgeEntries(data.entries);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleFileUpload() {
    if (!file) return;
    
    try {
      setLoading(true);
      setError("");
      const result = await uploadKnowledgeBase(token, file);
      if (result.success) {
        const columnInfo = result.columns ? ` using ${result.totalColumns} columns: ${result.columns.join(', ')}` : "";
        const rowInfo = result.rows ? ` from ${result.rows} rows` : "";
        setSuccess(`Knowledge base uploaded successfully!${rowInfo}${columnInfo}`);
        setFile(null);
        await loadKnowledgeBase();
      } else {
        setError(result.message || "Upload failed");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    try {
      await deleteKnowledgeEntry(token, id);
      await loadKnowledgeBase();
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

      {success && (
        <div className="rounded-md p-4 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      {/* Knowledge Base Upload */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">Knowledge Base Management</CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-primary">Upload Excel File</label>
            <p className="mb-2 text-xs text-gray-300">
              Upload an Excel file with any number of columns. Each cell value becomes a searchable keyword that will return all data from that row. The bot will prioritize this data over OpenAI responses.
            </p>
            <div className="flex gap-2">
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
              <Button 
                className="bg-green-500 text-white"
                onClick={handleFileUpload} 
                disabled={!file || loading}
                size="sm"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Entries */}
      {knowledgeEntries.length > 0 && (
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50">Knowledge Base Entries ({knowledgeEntries.length})</CardHeader>
          <CardContent>
            <div className="space-y-2">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{entry.keyword}</div>
                    <div className="text-xs text-gray-500">{entry.answer}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bot Response Priority Info */}
      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">Response Priority</CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-white"><strong className="text-primary">1. Knowledge Base:</strong> Exact and fuzzy matches from your Excel file</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-white"><strong className="text-primary">2. OpenAI:</strong> AI responses for unknown queries</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
              <span className="text-white"><strong className="text-primary">3. Fallback:</strong> Default responses when all else fails</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}