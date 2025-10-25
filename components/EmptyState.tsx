import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ChevronRight,
  Instagram,
  Globe,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActionButton {
  label: string;
  path?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionPath?: string;
  icon?: React.ReactNode;
  onActionClick?: () => void;
  actions?: ActionButton[];
  showGuide?: boolean;
}

/**
 * EmptyState component for displaying when no data is available
 * Defaults to showing a message about no recipes with a CTA to add a new one
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Recipes Found",
  message = "You don't have any recipes yet. Add your first recipe to get started.",
  actionLabel = "Add New Recipe",
  actionPath = "/add-recipe",
  icon = <UtensilsCrossed className="h-12 w-12 text-gray-400" />,
  onActionClick,
  actions = [],
  showGuide = false,
}) => {
  const navigate = useNavigate();

  const handleClick = (action?: ActionButton) => {
    if (action?.onClick) {
      action.onClick();
    } else if (action?.path) {
      navigate(action.path);
    } else if (onActionClick) {
      onActionClick();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  // If no actions provided, use the default action
  const allActions =
    actions.length > 0
      ? actions
      : [{ label: actionLabel, path: actionPath, onClick: onActionClick }];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="mb-4 bg-gray-50 p-4 rounded-full">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        <div className="flex flex-wrap gap-3 justify-center">
          {allActions.map((action, index) => (
            <Button
              key={index}
              onClick={() => handleClick(action)}
              variant={action.variant || "default"}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>

        {showGuide && (
          <div className="mt-10 w-full">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Ways to add your first recipe:
            </h4>
            <div className="space-y-3">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/add-recipe?tab=instagram")}
              >
                <CardContent className="p-4 flex items-center">
                  <div className="p-2 bg-green-50 rounded-full mr-3">
                    <Instagram className="h-5 w-5 text-recipe-green" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium">
                      Extract from Instagram
                    </h5>
                    <p className="text-xs text-gray-500">
                      Paste an Instagram recipe post URL
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/add-recipe?tab=url")}
              >
                <CardContent className="p-4 flex items-center">
                  <div className="p-2 bg-green-50 rounded-full mr-3">
                    <Globe className="h-5 w-5 text-recipe-green" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium">
                      Extract from a website
                    </h5>
                    <p className="text-xs text-gray-500">
                      Paste a URL from any recipe website
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/add-recipe?tab=manual")}
              >
                <CardContent className="p-4 flex items-center">
                  <div className="p-2 bg-green-50 rounded-full mr-3">
                    <Plus className="h-5 w-5 text-recipe-green" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium">Add manually</h5>
                    <p className="text-xs text-gray-500">
                      Type in your own recipe details
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
