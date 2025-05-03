import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define types
export interface CupboardItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expiryDate?: string;
  notes?: string;
}

interface CupboardContextType {
  items: CupboardItem[];
  loading: boolean;
  addItem: (item: CupboardItem) => void;
  updateItem: (updatedItem: CupboardItem) => void;
  deleteItem: (id: string) => void;
  getItemById: (id: string) => CupboardItem | undefined;
  getItemsByCategory: (category: string) => CupboardItem[];
}

// Create the context
const CupboardContext = createContext<CupboardContextType | undefined>(
  undefined
);

// Sample data
const sampleItems: CupboardItem[] = [
  {
    id: "1",
    name: "Flour",
    quantity: "2 kg",
    category: "Baking",
    expiryDate: "2023-12-31",
  },
  {
    id: "2",
    name: "Sugar",
    quantity: "1 kg",
    category: "Baking",
  },
  {
    id: "3",
    name: "Olive Oil",
    quantity: "500 ml",
    category: "Oils",
    notes: "Extra virgin",
  },
  {
    id: "4",
    name: "Rice",
    quantity: "1 kg",
    category: "Grains",
  },
  {
    id: "5",
    name: "Salt",
    quantity: "250 g",
    category: "Spices",
  },
];

// Provider component
export const CupboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CupboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items from storage when the component mounts
  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = await AsyncStorage.getItem("cupboard");
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        } else {
          // If no stored items, use sample data
          setItems(sampleItems);
          // Save sample data to storage
          await AsyncStorage.setItem("cupboard", JSON.stringify(sampleItems));
        }
      } catch (error) {
        console.error("Failed to load cupboard items from storage:", error);
        // Fallback to sample data
        setItems(sampleItems);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  // Save items to storage whenever they change
  useEffect(() => {
    const saveItems = async () => {
      if (!loading) {
        try {
          await AsyncStorage.setItem("cupboard", JSON.stringify(items));
        } catch (error) {
          console.error("Failed to save cupboard items to storage:", error);
        }
      }
    };

    saveItems();
  }, [items, loading]);

  // Add a new item
  const addItem = (item: CupboardItem) => {
    // Ensure item has a unique ID
    const newItem = {
      ...item,
      id: item.id || Date.now().toString(),
    };
    setItems((prevItems) => [...prevItems, newItem]);
  };

  // Update an existing item
  const updateItem = (updatedItem: CupboardItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  // Delete an item
  const deleteItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Get an item by ID
  const getItemById = (id: string) => {
    return items.find((item) => item.id === id);
  };

  // Get all items in a category
  const getItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  return (
    <CupboardContext.Provider
      value={{
        items,
        loading,
        addItem,
        updateItem,
        deleteItem,
        getItemById,
        getItemsByCategory,
      }}
    >
      {children}
    </CupboardContext.Provider>
  );
};

// Custom hook to use the cupboard context
export const useCupboard = () => {
  const context = useContext(CupboardContext);
  if (context === undefined) {
    throw new Error("useCupboard must be used within a CupboardProvider");
  }
  return context;
};
