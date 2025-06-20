
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsDashboard } from "@/components/StatsDashboard";
import { KnowledgeMap } from "@/components/KnowledgeMap";
import { BarChart3, Map, TrendingUp } from "lucide-react";

const Statistics = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="w-10 h-10 text-blue-600" />
              Learning Analytics
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track your vocabulary learning progress with detailed statistics and visual insights
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="knowledge-map" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Knowledge Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <StatsDashboard />
            </TabsContent>

            <TabsContent value="knowledge-map" className="space-y-6">
              <KnowledgeMap />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
