import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, Search, User } from "lucide-react";

const Footer: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home", icon: <Home size={20} /> },
    { to: "/recipes", label: "Recipes", icon: <BookOpen size={20} /> },
    { to: "/search", label: "Search", icon: <Search size={20} /> },
    { to: "/profile", label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-800 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center ${
                  isActive
                    ? "text-recipe-primary"
                    : "text-gray-500 hover:text-recipe-primary-hover"
                }`
              }
              end
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
