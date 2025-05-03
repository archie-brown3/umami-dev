import React, { useState } from "react";
import { Recipe, Ingredient, ShoppingItem } from "../types";
import {
  calculateIngredientCost,
  calculateRecipeCost,
  calculateShoppingListCost,
  getIngredientPrice,
} from "../services/pricing/pricingService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";

// Sample recipe for testing
const sampleRecipe: Recipe = {
  id: "sample-recipe",
  title: "Pasta with Tomato Sauce",
  description: "Simple pasta with tomato sauce",
  imageUrl: "",
  ingredients: [
    { id: "1", name: "pasta", quantity: "250", unit: "g", category: "grains" },
    { id: "2", name: "tomato", quantity: "4", unit: "", category: "produce" },
    {
      id: "3",
      name: "garlic",
      quantity: "2",
      unit: "cloves",
      category: "produce",
    },
    {
      id: "4",
      name: "olive oil",
      quantity: "2",
      unit: "tbsp",
      category: "oils",
    },
    { id: "5", name: "onion", quantity: "1", unit: "", category: "produce" },
    {
      id: "6",
      name: "ground beef",
      quantity: "200",
      unit: "g",
      category: "proteins",
    },
    { id: "7", name: "basil", quantity: "1", unit: "tbsp", category: "spices" },
    { id: "8", name: "salt", quantity: "1", unit: "tsp", category: "spices" },
    {
      id: "9",
      name: "pepper",
      quantity: "1/2",
      unit: "tsp",
      category: "spices",
    },
  ],
  steps: [
    "Cook pasta according to package instructions.",
    "Sauté onion and garlic in olive oil.",
    "Add ground beef and cook until browned.",
    "Add tomatoes and simmer for 10 minutes.",
    "Add basil, salt, and pepper.",
    "Serve sauce over pasta.",
  ],
  prepTime: 15,
  cookTime: 20,
  servings: 4,
  category: "Dinner",
  tags: ["pasta", "italian", "quick"],
  source: "Recipe Book",
  saved: true,
  createdAt: new Date().toISOString(),
};

// Sample shopping list for testing
const sampleShoppingItems: ShoppingItem[] = [
  {
    id: "1",
    name: "milk",
    quantity: "1",
    unit: "l",
    category: "dairy",
    checked: false,
    recipeId: "",
  },
  {
    id: "2",
    name: "eggs",
    quantity: "12",
    unit: "",
    category: "proteins",
    checked: false,
    recipeId: "",
  },
  {
    id: "3",
    name: "chicken breast",
    quantity: "500",
    unit: "g",
    category: "proteins",
    checked: false,
    recipeId: "",
  },
  {
    id: "4",
    name: "rice",
    quantity: "2",
    unit: "kg",
    category: "grains",
    checked: false,
    recipeId: "",
  },
  {
    id: "5",
    name: "tomatoes",
    quantity: "6",
    unit: "",
    category: "produce",
    checked: false,
    recipeId: "",
  },
];

const PricingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState("recipe");
  const [customIngredient, setCustomIngredient] = useState({
    name: "",
    quantity: "",
    unit: "",
  });
  const [customIngredientCost, setCustomIngredientCost] = useState<any>(null);

  // Calculate recipe cost
  const recipeCost = calculateRecipeCost(sampleRecipe);

  // Calculate shopping list cost
  const shoppingListCost = calculateShoppingListCost(sampleShoppingItems);

  // Handle calculate custom ingredient cost
  const handleCalculateCustomIngredient = () => {
    if (!customIngredient.name) return;

    const ingredient: Ingredient = {
      id: "custom",
      name: customIngredient.name,
      quantity: customIngredient.quantity || "1",
      unit: customIngredient.unit || "",
      category: "other",
    };

    setCustomIngredientCost(calculateIngredientCost(ingredient));
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Recipe Pricing Engine</CardTitle>
        <CardDescription>
          Calculate costs for ingredients, recipes, and shopping lists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="recipe"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="recipe">Recipe Cost</TabsTrigger>
            <TabsTrigger value="shopping">Shopping List</TabsTrigger>
            <TabsTrigger value="ingredient">Single Ingredient</TabsTrigger>
          </TabsList>

          <TabsContent value="recipe">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{recipeCost.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {recipeCost.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    Total: ${recipeCost.totalCost?.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Per serving: ${recipeCost.costPerServing?.toFixed(2)}
                  </p>
                </div>
              </div>

              <Table>
                <TableCaption>Recipe Ingredients Cost Breakdown</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeCost.ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell>{ingredient.name}</TableCell>
                      <TableCell>
                        {ingredient.quantity} {ingredient.unit}
                      </TableCell>
                      <TableCell>
                        {ingredient.cost && ingredient.quantity
                          ? `$${(
                              ingredient.cost / parseFloat(ingredient.quantity)
                            ).toFixed(2)} per ${ingredient.unit || "each"}`
                          : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        ${ingredient.cost?.toFixed(2) || "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-md">
                    Shopping Cost Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold">Package Price</h4>
                      <p className="text-2xl">
                        ${recipeCost.shoppingCost?.totalPackagePrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total cost of all packages
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recipe Cost</h4>
                      <p className="text-2xl">
                        ${recipeCost.shoppingCost?.totalRecipeCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Portion used for this recipe
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Leftover Value</h4>
                      <p className="text-2xl">
                        ${recipeCost.shoppingCost?.leftoverValue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Value of leftover ingredients
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shopping">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Shopping List</h3>
                <div className="text-right">
                  <p className="font-bold">
                    Total: ${shoppingListCost.totalCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Package cost: $
                    {shoppingListCost.totalPackageCost.toFixed(2)}
                  </p>
                </div>
              </div>

              <Table>
                <TableCaption>Shopping List Cost Breakdown</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Package Size</TableHead>
                    <TableHead>Package Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shoppingListCost.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>{item.packageSize}</TableCell>
                      <TableCell>${item.packagePrice?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        ${item.cost?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="ingredient">
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Ingredient name"
                    value={customIngredient.name}
                    onChange={(e) =>
                      setCustomIngredient({
                        ...customIngredient,
                        name: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Quantity (e.g. 250)"
                    value={customIngredient.quantity}
                    onChange={(e) =>
                      setCustomIngredient({
                        ...customIngredient,
                        quantity: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Unit (e.g. g, cup)"
                    value={customIngredient.unit}
                    onChange={(e) =>
                      setCustomIngredient({
                        ...customIngredient,
                        unit: e.target.value,
                      })
                    }
                  />
                </div>

                <Button onClick={handleCalculateCustomIngredient}>
                  Calculate Cost
                </Button>
              </div>

              {customIngredientCost && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-md">
                      Cost for {customIngredient.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Cost:</p>
                        <p className="text-2xl">
                          ${customIngredientCost.cost.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customIngredientCost.quantity}{" "}
                          {customIngredientCost.unit}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Base Price Info:</p>
                        <p>
                          {(() => {
                            const priceInfo = getIngredientPrice(
                              customIngredient.name
                            );
                            return `$${priceInfo.price.toFixed(4)} per ${
                              priceInfo.unit
                            }`;
                          })()}
                        </p>
                        <Badge variant="outline">
                          {(() => {
                            const priceInfo = getIngredientPrice(
                              customIngredient.name
                            );
                            return priceInfo.source;
                          })()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Pricing data generated using local pricing engine. Prices are
          estimates and may vary.
        </p>
      </CardFooter>
    </Card>
  );
};

export default PricingDemo;
