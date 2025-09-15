"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSallaReviews, updateSallaReview } from "@/lib/api";

interface SallaReviewsQuestionsProps {
  onMessage: (message: string) => void;
}

export default function SallaReviewsQuestions({ onMessage }: SallaReviewsQuestionsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editResponse, setEditResponse] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      
      // Load reviews
      const reviewsResponse = await listSallaReviews(token, 1, 50, 'rating');
      if (reviewsResponse.ok && reviewsResponse.reviews) {
        setReviews(reviewsResponse.reviews);
      }
      
      // Load questions
      const questionsResponse = await listSallaReviews(token, 1, 50, 'ask');
      if (questionsResponse.ok && questionsResponse.questions) {
        setQuestions(questionsResponse.questions);
      }
      
    } catch (error) {
      onMessage('Error loading reviews and questions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token || !editingItem) return;

    try {
      const response = await updateSallaReview(token, editingItem.id, {
        status: editStatus,
        response: editResponse
      });
      
      if (response.ok) {
        onMessage(`${activeTab === 'reviews' ? 'Review' : 'Question'} updated successfully`);
        setEditingItem(null);
        loadData();
      } else {
        onMessage(response.message || `Failed to update ${activeTab === 'reviews' ? 'review' : 'question'}`);
      }
    } catch (error) {
      onMessage(`Error updating ${activeTab === 'reviews' ? 'review' : 'question'}`);
    }
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    const statusValue = item.status?.name || item.status?.label || item.status || '';
    setEditStatus(String(statusValue));
    setEditResponse(String(item.response || item.merchant_response || item.answer || ''));
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const renderItem = (item: any, type: 'review' | 'question') => (
    <div key={item.id} className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="font-medium">{type === 'review' ? 'Review' : 'Question'} #{String(item.id || 'N/A')}</h3>
            {type === 'review' && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">
                  {getRatingStars(item.rating || 0)}
                </span>
                <span className="text-sm text-gray-600">
                  ({String(item.rating || 0)}/5)
                </span>
              </div>
            )}
            <span className={`px-2 py-1 rounded-full text-xs ${
              item.status?.name === 'approved' || item.status === 'approved' || item.status?.name === 'answered' || item.status === 'answered'
                ? 'bg-green-100 text-green-800' 
                : item.status?.name === 'pending' || item.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {String(item.status?.name || item.status?.label || item.status || 'Unknown')}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Customer:</span> {String(item.customer?.name || item.customer_name || 'Anonymous')}
            </div>
            <div>
              <span className="font-medium">Product:</span> {String(item.product?.name || item.product_name || 'N/A')}
            </div>
            <div>
              <span className="font-medium">{type === 'review' ? 'Comment' : 'Question'}:</span> 
              <p className="mt-1 p-2 bg-gray-50 rounded text-gray-700">
                {String(item.comment || item.review || item.question || item.text || 'No content')}
              </p>
            </div>
            {item.response || item.merchant_response || item.answer ? (
              <div>
                <span className="font-medium">Your {type === 'review' ? 'Response' : 'Answer'}:</span>
                <p className="mt-1 p-2 bg-blue-50 rounded text-blue-700">
                  {String(item.response || item.merchant_response || item.answer)}
                </p>
              </div>
            ) : null}
            <div className="text-xs text-gray-500">
              {type === 'review' ? 'Created' : 'Asked'}: {String(item.created_at || item.created || 'N/A')}
              {item.answered_at && (
                <span> • Answered: {String(item.answered_at)}</span>
              )}
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
          {type === 'review' ? 'Manage' : 'Answer'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'reviews' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({reviews.length})
              </Button>
              <Button
                variant={activeTab === 'questions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('questions')}
              >
                Questions ({questions.length})
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'reviews' ? (
            reviews.length === 0 ? (
              <p className="text-sm text-gray-600">No reviews found.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => renderItem(review, 'review'))}
              </div>
            )
          ) : (
            questions.length === 0 ? (
              <p className="text-sm text-gray-600">No questions found.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => renderItem(question, 'question'))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {activeTab === 'reviews' ? 'Manage Review' : 'Answer Question'}
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {activeTab === 'reviews' ? 'Review' : 'Question'} ID
                  </label>
                  <input
                    type="text"
                    value={String(editingItem.id || '')}
                    className="w-full p-2 border rounded-md bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    {activeTab === 'reviews' ? (
                      <>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </>
                    ) : (
                      <>
                        <option value="answered">Answered</option>
                        <option value="closed">Closed</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your {activeTab === 'reviews' ? 'Response' : 'Answer'}
                </label>
                <textarea
                  value={editResponse}
                  onChange={(e) => setEditResponse(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  placeholder={activeTab === 'reviews' ? 'Respond to this review...' : 'Type your answer here...'}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium mb-2">
                  Original {activeTab === 'reviews' ? 'Review' : 'Question'}:
                </h4>
                <p className="text-sm text-gray-700">
                  {String(editingItem.comment || editingItem.review || editingItem.question || editingItem.text || 'No content')}
                </p>
                {activeTab === 'reviews' && (
                  <div className="mt-2 text-xs text-gray-500">
                    Rating: {getRatingStars(editingItem.rating || 0)} ({String(editingItem.rating || 0)}/5)
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  From: {String(editingItem.customer?.name || editingItem.customer_name || 'Anonymous')}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : `Update ${activeTab === 'reviews' ? 'Review' : 'Question'}`}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}





