import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Book,
  Calendar,
  ShoppingCart,
  Plus,
  X,
  FileText,
  Camera,
  Globe,
  PenLine,
  Instagram,
  BookOpen,
  Search,
  User,
  Settings,
  Utensils,
  CalendarDays,
  Package,
  Link as LinkIcon,
  ImagePlus,
  Wand2,
  CalendarClock,
  Sparkles,
  Apple,
} from "lucide-react";
// import { AnimatePresence, motion } from "framer-motion";
// import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import UserMenu from "./UserMenu";
import { NetworkStatusBar } from "./NetworkStatusBar";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

// Define the green glow effect at the top of the file
const activeNavGlow =
  "text-recipe-green bg-gradient-to-b from-recipe-green/10 to-recipe-green/5 shadow-[0_5px_15px_-3px_rgba(138,179,159,0.25)]";

const Layout: React.FC<LayoutProps> = ({ children, hideHeader = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuOption = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  // Hide FAB on recipe detail and add recipe pages
  const shouldShowFab =
    !location.pathname.includes("/recipe/") &&
    !location.pathname.includes("/add-recipe") &&
    !location.pathname.includes("/edit-recipe");

  const fabOptions = [
    {
      label: "Manual Entry",
      icon: <PenLine size={20} />,
      route: "/add-recipe",
      color: "bg-emerald-500",
    },
    {
      label: "Text/Photo",
      icon: <Camera size={20} />,
      route: "/add-recipe?tab=ai",
      color: "bg-amber-500",
    },
    {
      label: "Instagram",
      icon: <Instagram size={20} />,
      route: "/add-recipe?tab=instagram",
      color: "bg-pink-500",
    },
    {
      label: "Recipe URL",
      icon: <Globe size={20} />,
      route: "/add-recipe?tab=url",
      color: "bg-blue-500",
    },
  ];

  const toggleFab = () => {
    setIsFabOpen(!isFabOpen);
  };

  const handleOptionClick = (route: string) => {
    navigate(route);
    setIsFabOpen(false);
  };

  // Handle the profile icon click to navigate correctly
  const handleProfileClick = () => {
    navigate("/profile");
  };

  const AddButton = () => {
    return (
      <Link
        to="/add-recipe"
        className="fixed z-50 bottom-[calc(var(--navbar-height)+1rem)] right-4 h-12 w-12 flex items-center justify-center rounded-full bg-recipe-green shadow-lg transition-transform duration-200 active:scale-95"
        aria-label="Add Recipe"
      >
        <Plus className="text-white" size={24} />
      </Link>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-recipe-light">
      {/* Status bar spacer for iOS - this ensures content stays below the notch/island */}
      <div className="w-full h-[env(safe-area-inset-top)] bg-recipe-light"></div>

      {!hideHeader && (
        <header className="sticky top-0 left-0 right-0 bg-white dark:bg-gray-900 z-30 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <div
                className="font-bold text-xl text-recipe-primary cursor-pointer"
                onClick={() => navigate("/")}
              >
                <h1 className="text-xl font-black">Recipe Saver</h1>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => navigate("/search")}
                >
                  <Search
                    size={20}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </button>

                <UserMenu />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Network Status Bar - visible when online or offline */}
      <NetworkStatusBar />

      {/* Add padding top when header is visible to prevent content from being hidden under the header */}
      <main
        className={`flex-grow container mx-auto px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] ${
          !hideHeader ? "pt-2" : ""
        }`}
      >
        {children}
      </main>

      {/* Mobile Navigation - Fixed at bottom with safe area padding */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-center items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="w-full max-w-md flex justify-around items-center">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-16 ${
              isActive("/")
                ? activeNavGlow
                : "text-gray-500 hover:text-gray-700"
            } rounded-lg py-1 px-3`}
          >
            <Home size={20} />
            <div className="text-xs text-center mt-1">Home</div>
          </Link>

          <Link
            to="/recipes"
            className={`flex flex-col items-center justify-center w-16 ${
              isActive("/recipes")
                ? activeNavGlow
                : "text-gray-500 hover:text-gray-700"
            } rounded-lg py-1 px-3`}
          >
            <Book size={20} />
            <div className="text-xs text-center mt-1">Recipes</div>
          </Link>

          {/* Add Recipe Button (centered) - Raised higher with shadow */}
          <div className="relative flex justify-center w-16">
            <button
              onClick={() => navigate("/add-recipe")}
              className="absolute -top-8 bg-[#8AB39F] text-white p-4 rounded-full shadow-xl hover:bg-[#7aa08c] transition-colors"
              style={{ transform: "translateY(-10px)" }}
              aria-label="Add recipe"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
            <div className="text-xs text-center mt-10">Add</div>
          </div>

          <Link
            to="/meal-plan"
            className={`flex flex-col items-center justify-center w-16 ${
              isActive("/meal-plan")
                ? activeNavGlow
                : "text-gray-500 hover:text-gray-700"
            } rounded-lg py-1 px-3`}
          >
            <Calendar size={20} />
            <div className="text-xs text-center mt-1">Plan</div>
          </Link>

          <Link
            to="/shopping-list"
            className={`flex flex-col items-center justify-center w-16 ${
              isActive("/shopping-list")
                ? activeNavGlow
                : "text-gray-500 hover:text-gray-700"
            } rounded-lg py-1 px-3`}
          >
            <ShoppingCart size={20} />
            <div className="text-xs text-center mt-1">Shopping</div>
          </Link>
        </div>
      </nav>

      {shouldShowFab && <AddButton />}
    </div>
  );
};

export default Layout;
