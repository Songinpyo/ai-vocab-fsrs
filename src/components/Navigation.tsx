import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Brain, BookOpen, BarChart3, Settings, Gamepad2 } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Add Words", icon: Home },
    { path: "/study", label: "Study", icon: Brain },
    { path: "/games", label: "Games", icon: Gamepad2 },
    { path: "/my-words", label: "My Words", icon: BookOpen },
    { path: "/statistics", label: "Statistics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              AI Vocabulary
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};