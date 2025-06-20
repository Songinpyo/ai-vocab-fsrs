
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon, Key, Save, Bot } from "lucide-react";
import { geminiService } from "@/services/geminiService";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const geminiModels = [
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (Recommended) [0.075$ for 1M tokens]" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (More Powerful) [0.10$ for 1M tokens]" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (More Powerful) [0.12$ for 1M tokens]" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Most Powerful) [0.30$ for 1M tokens]" },
  ];

  useEffect(() => {
    // Load existing API key and model on component mount
    const existingKey = localStorage.getItem('gemini_api_key');
    if (existingKey) {
      setApiKey(existingKey);
    }
    
    const currentModel = geminiService.getModel();
    setSelectedModel(currentModel);
  }, []);

  const handleSaveSettings = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    if (!selectedModel) {
      toast.error("Please select a model");
      return;
    }

    setIsLoading(true);
    try {
      // Save the API key and model
      geminiService.setApiKey(apiKey);
      geminiService.setModel(selectedModel);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSettings = () => {
    setApiKey("");
    setSelectedModel("gemini-2.0-flash-lite");
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('gemini_model');
    geminiService.setModel("gemini-2.0-flash-lite");
    toast.success("Settings cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your AI vocabulary app</p>
            </div>
          </div>

          {/* API Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Gemini API Configuration
              </CardTitle>
              <CardDescription>
                Enter your Google Gemini API key and select the model to enable AI-powered word definitions and translations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-select">Gemini Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Gemini model" />
                  </SelectTrigger>
                  <SelectContent>
                    {geminiModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          {model.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Settings"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearSettings}
                >
                  Clear
                </Button>
              </div>

              <div className="text-sm text-gray-500 mt-4">
                <p><strong>Note:</strong> Your API key is stored locally in your browser and never sent to our servers.</p>
                <p className="mt-1">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Get your Gemini API key here →
                  </a>
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Model Recommendations:</strong>
                  </p>
                  <ul className="text-blue-700 text-sm mt-1 space-y-1">
                    <li>• <strong>Flash:</strong> Fastest and most cost-effective for vocabulary lookup</li>
                    <li>• <strong>Pro:</strong> More detailed and nuanced definitions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>
                AI Vocabulary Builder - A privacy-focused vocabulary learning app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Data Storage:</strong> Local browser storage</p>
                <p><strong>Privacy:</strong> All data stays on your device</p>
                <p><strong>Current Model:</strong> {selectedModel || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
