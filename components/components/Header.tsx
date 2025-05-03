import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Home, Search, Settings, User } from "lucide-react";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path ? "text-recipe-primary" : "text-gray-500";
  };

  return (
    <header className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="font-bold text-xl text-recipe-primary">
            Recipe Saver
          </Link>

          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => navigate("/search")}
            >
              <Search size={20} className="text-gray-600 dark:text-gray-300" />
            </button>

            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => navigate("/settings")}
            >
              <Settings
                size={20}
                className="text-gray-600 dark:text-gray-300"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
