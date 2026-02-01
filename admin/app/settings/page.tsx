"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Settings as SettingsIcon, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    api.get("/admin/settings")
      .then(res => {
        const s: Record<string, string> = {};
        if (Array.isArray(res.data.settings)) {
          res.data.settings.forEach((item: any) => {
            s[item.setting_key] = item.setting_value;
          });
        }
        setSettings(s);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post("/admin/settings", settings);
      alert("Settings saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Configuration</h1>
          <p className="text-sm text-gray-500 font-medium">Fine-tune global platform settings and behavior</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving || loading}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 rounded-xl transition-all"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Deploying..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">General Identity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Site Brand Name</Label>
                <Input 
                  value={settings.site_name || ""} 
                  onChange={e => setSettings(p => ({...p, site_name: e.target.value}))}
                  className="rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all py-6"
                  placeholder="e.g. Nimora"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Email</Label>
                <Input 
                  value={settings.contact_email || ""} 
                  onChange={e => setSettings(p => ({...p, contact_email: e.target.value}))}
                  className="rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all py-6"
                  placeholder="support@nimora.uz"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">Security & Moderation</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-gray-50">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-gray-900">Registration Status</div>
                  <div className="text-xs text-gray-400 font-medium">Allow new users to join the platform</div>
                </div>
                <div 
                  onClick={() => setSettings(p => ({...p, allow_registration: p.allow_registration === "true" ? "false" : "true"}))}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.allow_registration === "true" ? "bg-gray-900" : "bg-gray-200"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.allow_registration === "true" ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-gray-50">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-gray-900">Post Pre-approval</div>
                  <div className="text-xs text-gray-400 font-medium">Require moderator approval before publishing posts</div>
                </div>
                <div 
                  onClick={() => setSettings(p => ({...p, require_approval: p.require_approval === "true" ? "false" : "true"}))}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.require_approval === "true" ? "bg-gray-900" : "bg-gray-200"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.require_approval === "true" ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
