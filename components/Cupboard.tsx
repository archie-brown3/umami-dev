import React, { useState } from "react";
import { useCupboard } from "@/context/CupboardContext";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { format, isAfter, isBefore, parseISO } from "date-fns";

const categories = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Frozen",
  "Beverages",
  "Other",
];

export function Cupboard() {
  const { items, addItem, updateItem, deleteItem, loading, error } =
    useCupboard();
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [newItemExpiration, setNewItemExpiration] = useState("");

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addItem({
      name: newItemName,
      quantity: newItemQuantity,
      unit: newItemUnit,
      category: newItemCategory,
      expiration_date: newItemExpiration || undefined,
    });
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemUnit("");
    setNewItemCategory("Other");
    setNewItemExpiration("");
  };

  const getExpirationStatus = (expirationDate: string | undefined) => {
    if (!expirationDate) return null;

    const today = new Date();
    const expDate = parseISO(expirationDate);
    const warningDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    if (isBefore(expDate, today)) {
      return "expired";
    } else if (isBefore(expDate, warningDate)) {
      return "expiring-soon";
    }
    return "good";
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const sortedItems = [...items].sort((a, b) => {
    if (!a.expiration_date && !b.expiration_date) return 0;
    if (!a.expiration_date) return 1;
    if (!b.expiration_date) return -1;
    return (
      new Date(a.expiration_date).getTime() -
      new Date(b.expiration_date).getTime()
    );
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">My Cupboard</h2>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="grid grid-cols-6 gap-2 mb-8">
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
        <Input
          type="date"
          value={newItemExpiration}
          onChange={(e) => setNewItemExpiration(e.target.value)}
          placeholder="Expiration Date"
        />
        <Button type="submit">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </form>

      {/* Items List */}
      <div className="space-y-2">
        {sortedItems.map((item) => {
          const expirationStatus = getExpirationStatus(item.expiration_date);

          return (
            <Card
              key={item.id}
              className={`p-4 ${
                expirationStatus === "expired"
                  ? "bg-red-50"
                  : expirationStatus === "expiring-soon"
                  ? "bg-yellow-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {expirationStatus === "expired" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{item.name}</span>
                  {item.quantity && (
                    <span className="text-gray-600">
                      {item.quantity} {item.unit}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{item.category}</span>
                  {item.expiration_date && (
                    <span
                      className={`text-sm ${
                        expirationStatus === "expired"
                          ? "text-red-600"
                          : expirationStatus === "expiring-soon"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      Expires:{" "}
                      {format(parseISO(item.expiration_date), "MMM d, yyyy")}
                    </span>
                  )}
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
          );
        })}
      </div>
    </div>
  );
}
