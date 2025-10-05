"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { 
  getBotSettings, 
  updateBotSettings, 
  resetBotSettings, 
  testAIResponse,
  getAvailableModels,
  getPersonalityTemplates,
  type BotSettings,
  type PersonalityTemplate,
  type AvailableModels
} from '@/lib/botSettingsApi';

export default function AISettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [templates, setTemplates] = useState<Record<string, PersonalityTemplate> | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, modelsRes, templatesRes] = await Promise.all([
        getBotSettings(),
        getAvailableModels(),
        getPersonalityTemplates()
      ]);
      
      if (settingsRes.success) setSettings(settingsRes.data);
      if (modelsRes.success) setAvailableModels(modelsRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await updateBotSettings(settings);
      if (res.success) {
        setSuccess('Settings saved successfully!');
        setSettings(res.data);
      } else {
        setError(res.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await resetBotSettings();
      if (res.success) {
        setSuccess('Settings reset to default successfully!');
        setSettings(res.data);
      } else {
        setError(res.message || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    
    setTesting(true);
    setTestResponse('');
    setError('');
    
    try {
      const res = await testAIResponse(testMessage);
      if (res.success) {
        setTestResponse(res.data.response);
      } else {
        setError(res.message || 'Failed to test AI response');
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      setError('Failed to test AI response');
    } finally {
      setTesting(false);
    }
  };

  const applyTemplate = (templateKey: string) => {
    if (!templates || !settings) return;
    
    const template = templates[templateKey];
    if (!template) return;
    
    setSettings({
      ...settings,
      personality: templateKey as any,
      systemPrompt: template.systemPrompt,
      greetingPrompt: template.greetingPrompt,
      farewellPrompt: template.farewellPrompt
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-red-500">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">AI Bot Settings</h1>
      
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'general', label: 'General' },
            { id: 'ai', label: 'AI Models' },
            { id: 'personality', label: 'Personality' },
            { id: 'business', label: 'Business' },
            { id: 'prompts', label: 'Prompts' },
            { id: 'advanced', label: 'Advanced' },
            { id: 'test', label: 'Test' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Response Length</label>
                <select
                  value={settings.responseLength}
                  onChange={(e) => setSettings({...settings, responseLength: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="arabic">Arabic</option>
                  <option value="english">English</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeEmojis}
                  onChange={(e) => setSettings({...settings, includeEmojis: e.target.checked})}
                  className="mr-2"
                />
                Include Emojis
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeGreetings}
                  onChange={(e) => setSettings({...settings, includeGreetings: e.target.checked})}
                  className="mr-2"
                />
                Include Greetings
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeFarewells}
                  onChange={(e) => setSettings({...settings, includeFarewells: e.target.checked})}
                  className="mr-2"
                />
                Include Farewells
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Models Settings */}
      {activeTab === 'ai' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Models Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Provider</label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings({...settings, aiProvider: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="openai">OpenAI Only</option>
                  <option value="gemini">Gemini Only</option>
                  <option value="both">Both (Fallback)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{settings.temperature}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">OpenAI Model</label>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => setSettings({...settings, openaiModel: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  {availableModels?.openai.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Gemini Model</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({...settings, geminiModel: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  {availableModels?.gemini.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Tokens</label>
              <input
                type="number"
                min="100"
                max="4000"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personality Settings */}
      {activeTab === 'personality' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personality & Tone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Personality Type</label>
                <select
                  value={settings.personality}
                  onChange={(e) => setSettings({...settings, personality: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="marketing">Marketing</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Dialect</label>
                <select
                  value={settings.dialect}
                  onChange={(e) => setSettings({...settings, dialect: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="saudi">Saudi</option>
                  <option value="egyptian">Egyptian</option>
                  <option value="lebanese">Lebanese</option>
                  <option value="emirati">Emirati</option>
                  <option value="kuwaiti">Kuwaiti</option>
                  <option value="qatari">Qatari</option>
                  <option value="bahraini">Bahraini</option>
                  <option value="omani">Omani</option>
                  <option value="jordanian">Jordanian</option>
                  <option value="palestinian">Palestinian</option>
                  <option value="syrian">Syrian</option>
                  <option value="iraqi">Iraqi</option>
                  <option value="standard">Standard Arabic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings({...settings, tone: e.target.value as any})}
                className="w-full p-2 border rounded-md"
              >
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Personality Templates */}
            {templates && (
              <div>
                <label className="block text-sm font-medium mb-2">Quick Templates</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => applyTemplate(key)}
                      className="p-3 border rounded-md text-left hover:bg-gray-50"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Business Settings */}
      {activeTab === 'business' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name</label>
                <input
                  type="text"
                  value={settings.businessName || ''}
                  onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="Your business name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Business Type</label>
                <input
                  type="text"
                  value={settings.businessType || ''}
                  onChange={(e) => setSettings({...settings, businessType: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., E-commerce, Restaurant, Services"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Description</label>
              <textarea
                value={settings.businessDescription || ''}
                onChange={(e) => setSettings({...settings, businessDescription: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Describe your business and what you offer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <textarea
                value={settings.targetAudience || ''}
                onChange={(e) => setSettings({...settings, targetAudience: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Describe your target customers"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Prompts */}
      {activeTab === 'prompts' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Custom Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">System Prompt</label>
              <textarea
                value={settings.systemPrompt || ''}
                onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
                className="w-full p-2 border rounded-md h-32"
                placeholder="Main system prompt that defines the bot's behavior"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Greeting Prompt</label>
                <textarea
                  value={settings.greetingPrompt || ''}
                  onChange={(e) => setSettings({...settings, greetingPrompt: e.target.value})}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="How the bot should greet customers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Farewell Prompt</label>
                <textarea
                  value={settings.farewellPrompt || ''}
                  onChange={(e) => setSettings({...settings, farewellPrompt: e.target.value})}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="How the bot should say goodbye"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sales Prompt</label>
              <textarea
                value={settings.salesPrompt || ''}
                onChange={(e) => setSettings({...settings, salesPrompt: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="How the bot should handle sales conversations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Objection Handling Prompt</label>
              <textarea
                value={settings.objectionHandlingPrompt || ''}
                onChange={(e) => setSettings({...settings, objectionHandlingPrompt: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="How the bot should handle customer objections"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableContextMemory}
                  onChange={(e) => setSettings({...settings, enableContextMemory: e.target.checked})}
                  className="mr-2"
                />
                Enable Context Memory
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableFallback}
                  onChange={(e) => setSettings({...settings, enableFallback: e.target.checked})}
                  className="mr-2"
                />
                Enable Fallback Responses
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Context Window (messages)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={settings.contextWindow}
                onChange={(e) => setSettings({...settings, contextWindow: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fallback Message</label>
              <textarea
                value={settings.fallbackMessage || ''}
                onChange={(e) => setSettings({...settings, fallbackMessage: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="Message to send when AI cannot respond"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trackConversations}
                  onChange={(e) => setSettings({...settings, trackConversations: e.target.checked})}
                  className="mr-2"
                />
                Track Conversations
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trackPerformance}
                  onChange={(e) => setSettings({...settings, trackPerformance: e.target.checked})}
                  className="mr-2"
                />
                Track Performance
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test AI */}
      {activeTab === 'test' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test AI Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Message</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Type a test message to see how the bot responds"
              />
            </div>
            
            <Button
              onClick={handleTest}
              disabled={!testMessage.trim() || testing}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {testing ? 'Testing...' : 'Test Response'}
            </Button>

            {testResponse && (
              <div className="mt-4 p-4 bg-gray-50 border rounded-md">
                <h4 className="font-medium mb-2">AI Response:</h4>
                <p className="text-gray-700">{testResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        
        <Button
          onClick={handleReset}
          disabled={saving}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          {saving ? 'Resetting...' : 'Reset to Default'}
        </Button>
      </div>
    </div>
  );
}




