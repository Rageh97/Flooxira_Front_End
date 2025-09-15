"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSallaSettings, updateSallaSettings } from "@/lib/api";

interface SallaSettingsProps {
  onMessage: (message: string) => void;
}

const ENTITIES = [
  { value: 'store', label: 'Store Settings', icon: '🏪' },
  { value: 'orders', label: 'Orders Settings', icon: '📋' },
  { value: 'products', label: 'Products Settings', icon: '📦' },
  { value: 'reports', label: 'Reports Settings', icon: '📊' },
  { value: 'customers', label: 'Customers Settings', icon: '👥' },
  { value: 'blogs', label: 'Blogs Settings', icon: '📝' },
  { value: 'mahally', label: 'Mahally Settings', icon: '🏘️' },
  { value: 'feedbacks', label: 'Feedbacks Settings', icon: '💬' }
];

export default function SallaSettings({ onMessage }: SallaSettingsProps) {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSettings, setEditedSettings] = useState<any>({});
  const [activeEntity, setActiveEntity] = useState('store');

  useEffect(() => {
    loadSettings();
  }, [activeEntity]);

  const loadSettings = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const response = await getSallaSettings(token, activeEntity);
      if (response.ok && response.settings) {
        setSettings(response.settings);
        // Convert array to object for editing
        const settingsObj = response.settings.reduce((acc: any, setting: any) => {
          acc[setting.slug] = setting.value;
          return acc;
        }, {});
        setEditedSettings(settingsObj);
      } else {
        onMessage(response.message || 'Failed to load settings');
      }
    } catch (error) {
      onMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setSaving(true);
      const response = await updateSallaSettings(token, {
        entity: activeEntity,
        ...editedSettings
      });
      
      if (response.ok) {
        onMessage('Settings updated successfully');
        loadSettings(); // Reload to get updated settings
        setEditMode(false);
      } else {
        onMessage(response.message || 'Failed to update settings');
      }
    } catch (error) {
      onMessage('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setEditedSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const renderSettingField = (setting: any) => {
    const { slug, type, value } = setting;
    const currentValue = editedSettings[slug] !== undefined ? editedSettings[slug] : value;
    
    const getFieldLabel = (slug: string) => {
      return slug.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || slug;
    };

    if (type === 'boolean') {
      return (
        <div key={slug} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={slug}
            checked={Boolean(currentValue)}
            onChange={(e) => handleInputChange(slug, e.target.checked)}
            className="rounded"
            disabled={!editMode}
          />
          <label htmlFor={slug} className="text-sm font-medium">
            {getFieldLabel(slug)}
          </label>
        </div>
      );
    } else if (type === 'dropdown') {
      return (
        <div key={slug} className="space-y-1">
          <label className="text-sm font-medium">
            {getFieldLabel(slug)}
          </label>
          <select
            value={Array.isArray(currentValue) ? currentValue.join(',') : String(currentValue || '')}
            onChange={(e) => {
              const values = e.target.value.split(',').filter(v => v.trim());
              handleInputChange(slug, values);
            }}
            className="w-full p-2 border rounded-md"
            disabled={!editMode}
          >
            <option value="">Select options</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="email,sms">Email & SMS</option>
          </select>
        </div>
      );
    } else if (type === 'form') {
      return (
        <div key={slug} className="space-y-1">
          <label className="text-sm font-medium">
            {getFieldLabel(slug)}
          </label>
          <textarea
            value={String(currentValue || '')}
            onChange={(e) => handleInputChange(slug, e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            disabled={!editMode}
            placeholder="Form configuration"
          />
        </div>
      );
    } else if (type === 'object') {
      return (
        <div key={slug} className="space-y-1">
          <label className="text-sm font-medium">
            {getFieldLabel(slug)}
          </label>
          <textarea
            value={JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(slug, parsed);
              } catch {
                // Invalid JSON, keep as string
                handleInputChange(slug, e.target.value);
              }
            }}
            className="w-full p-2 border rounded-md text-xs font-mono"
            rows={4}
            disabled={!editMode}
          />
        </div>
      );
    } else {
      return (
        <div key={slug} className="space-y-1">
          <label className="text-sm font-medium">
            {getFieldLabel(slug)}
          </label>
          <input
            type={type === 'integer' ? 'number' : 'text'}
            value={String(currentValue || '')}
            onChange={(e) => handleInputChange(slug, e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={!editMode}
          />
        </div>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">No settings found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Entity Selection */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Settings Categories</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ENTITIES.map((entity) => (
              <Button
                key={entity.value}
                variant={activeEntity === entity.value ? 'default' : 'outline'}
                onClick={() => setActiveEntity(entity.value)}
                className="flex items-center gap-2 h-auto p-3"
              >
                <span className="text-lg">{entity.icon}</span>
                <span className="text-sm">{entity.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {ENTITIES.find(e => e.value === activeEntity)?.label} ({settings.length})
            </h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadSettings} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              {!editMode ? (
                <Button onClick={() => setEditMode(true)}>
                  Edit Settings
                </Button>
              ) : (
                <>
                  <Button onClick={() => setEditMode(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-sm text-gray-600">No settings found for this category.</p>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {settings.map((setting) => renderSettingField(setting))}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



