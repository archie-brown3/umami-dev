import React, { useState } from "react";
import { useShoppingList } from "@/context/ShoppingListContext";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const categories = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Frozen",
  "Beverages",
  "Other",
];

export function ShoppingList() {
  const {
    lists,
    currentList,
    setCurrentList,
    addList,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    loading,
    error,
  } = useShoppingList();

  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await addList(newListName);
    setNewListName("");
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addItem({
      name: newItemName,
      quantity: newItemQuantity,
      unit: newItemUnit,
      category: newItemCategory,
      checked: false,
    });
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemUnit("");
    setNewItemCategory("Other");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Lists Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Shopping Lists</h2>
        <div className="flex gap-4 mb-4">
          {lists.map((list) => (
            <Card
              key={list.id}
              className={`p-4 cursor-pointer ${
                currentList?.id === list.id ? "border-recipe-green" : ""
              }`}
              onClick={() => setCurrentList(list)}
            >
              <div className="flex items-center justify-between">
                <span>{list.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteList(list.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Add New List Form */}
        <form onSubmit={handleAddList} className="flex gap-2">
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New List Name"
          />
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Add List
          </Button>
        </form>
      </div>

      {/* Current List Items */}
      {currentList && (
        <div>
          <h3 className="text-xl font-semibold mb-4">{currentList.name}</h3>

          {/* Add New Item Form */}
          <form
            onSubmit={handleAddItem}
            className="grid grid-cols-5 gap-2 mb-6"
          >
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item Name"
              className="col-span-2"
            />
            <Input
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              placeholder="Quantity"
            />
            <Input
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              placeholder="Unit"
            />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </form>

          {/* Items List */}
          <div className="space-y-2">
            {currentList.items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateItem(item.id, { checked: !item.checked })
                      }
                    >
                      {item.checked ? (
                        <Check className="h-4 w-4 text-recipe-green" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <span
                      className={
                        item.checked ? "line-through text-gray-500" : ""
                      }
                    >
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-gray-600">
                        {item.quantity} {item.unit}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {item.category}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;
