import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface PlusMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function PlusMenu({ isOpen, onClose }: PlusMenuProps) {
  const router = useRouter();

  const menuSections: MenuSection[] = [
    {
      title: "Add Recipe",
      items: [
        {
          label: "Manual Entry",
          icon: <Ionicons name="create-outline" size={20} color="white" />,
          onClick: () => router.push("/(tabs)/recipes"),
          color: "bg-emerald-500",
        },
        {
          label: "Text/Photo",
          icon: <Ionicons name="camera-outline" size={20} color="white" />,
          onClick: () => router.push("/(tabs)/recipes?mode=ai"),
          color: "bg-amber-500",
        },
        {
          label: "Recipe URL",
          icon: <Ionicons name="globe-outline" size={20} color="white" />,
          onClick: () => router.push("/(tabs)/recipes?mode=url"),
          color: "bg-blue-500",
        },
        {
          label: "Instagram",
          icon: <Ionicons name="logo-instagram" size={20} color="white" />,
          onClick: () => router.push("/(tabs)/recipes?mode=instagram"),
          color: "bg-pink-500",
        },
      ],
    },
    {
      title: "Shopping & Inventory",
      items: [
        {
          label: "Add to Shopping List",
          icon: <Ionicons name="cart-outline" size={20} color="white" />,
          onClick: () => router.push("/(tabs)/shopping-list"),
          color: "bg-purple-500",
        },
        {
          label: "Add to Cupboard",
          icon: <Ionicons name="cube-outline" size={20} color="white" />,
          onClick: () => router.push("/(tabs)/explore"),
          color: "bg-orange-500",
        },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                {section.title}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    className={`flex flex-col items-center justify-center gap-2 p-4 ${item.color}`}
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
