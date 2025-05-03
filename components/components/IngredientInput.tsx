import React, { useState, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { searchIngredients, IngredientDetails } from "@/services/nutrition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Sparkles,
  Trash,
} from "lucide-react";
import { NutrientDisplay } from "./NutrientDisplay";

const COMMON_UNITS = [
  { value: "g", label: "grams (g)" },
  { value: "kg", label: "kilograms (kg)" },
  { value: "oz", label: "ounces (oz)" },
  { value: "lb", label: "pounds (lb)" },
  { value: "cup", label: "cups" },
  { value: "tbsp", label: "tablespoons" },
  { value: "tsp", label: "teaspoons" },
  { value: "ml", label: "milliliters (ml)" },
  { value: "l", label: "liters (l)" },
  { value: "pinch", label: "pinch" },
  { value: "piece", label: "piece" },
  { value: "slice", label: "slice" },
  { value: "clove", label: "clove" },
  { value: "whole", label: "whole" },
];

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  ingredientDetails?: IngredientDetails;
}

interface IngredientInputProps {
  ingredient: Ingredient;
  onChange: (ingredient: Ingredient) => void;
  onRemove: () => void;
  showNutrition?: boolean;
}

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredient,
  onChange,
  onRemove,
  showNutrition = true,
}) => {
  const [searchResults, setSearchResults] = useState<IngredientDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchIngredients(value);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching ingredients:", error);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  // Update search when ingredient name changes
  useEffect(() => {
    if (ingredient.name.length > 2) {
      debouncedSearch(ingredient.name);
    }
  }, [ingredient.name, debouncedSearch]);

  const handleNameChange = (value: string) => {
    onChange({ ...ingredient, name: value });
  };

  const handleSelectIngredient = (item: IngredientDetails) => {
    onChange({
      ...ingredient,
      name: item.name,
      ingredientDetails: item,
    });
    setOpen(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onChange({ ...ingredient, amount: value });
  };

  const handleUnitChange = (unit: string) => {
    onChange({ ...ingredient, unit });
    setUnitOpen(false);
  };

  return (
    <div className="flex flex-col space-y-2 p-3 border rounded-md bg-card shadow-sm">
      <div className="flex items-start gap-2">
        {/* Ingredient name with autocomplete */}
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center w-full">
                <Input
                  placeholder="Ingredient name"
                  value={ingredient.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => ingredient.name.length >= 2 && setOpen(true)}
                  className="w-full"
                  ref={searchInputRef}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-8 h-8 w-8"
                  onClick={() => setOpen(!open)}
                >
                  <Search size={16} className="text-muted-foreground" />
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full min-w-[240px]" align="start">
              <Command>
                <CommandInput
                  placeholder="Search ingredients..."
                  value={ingredient.name}
                  onValueChange={handleNameChange}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearching
                      ? "Searching..."
                      : "No ingredients found. You can still use this custom ingredient."}
                  </CommandEmpty>
                  <CommandGroup heading="Suggested Ingredients">
                    {searchResults.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => handleSelectIngredient(item)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            ingredient.ingredientDetails?.id === item.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {item.name}
                        {item.dataSource && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {item.dataSource}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount input */}
        <Input
          type="number"
          placeholder="Amount"
          value={ingredient.amount || ""}
          onChange={handleAmountChange}
          className="w-20"
          min={0}
          step={0.1}
        />

        {/* Unit selector */}
        <Popover open={unitOpen} onOpenChange={setUnitOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={unitOpen}
              className="w-24 justify-between"
            >
              {ingredient.unit || "Unit"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full max-h-52 overflow-y-auto">
            <Command>
              <CommandInput placeholder="Search unit..." />
              <CommandList>
                <CommandEmpty>No unit found.</CommandEmpty>
                <CommandGroup>
                  {COMMON_UNITS.map((unit) => (
                    <CommandItem
                      key={unit.value}
                      value={unit.value}
                      onSelect={() => handleUnitChange(unit.value)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          ingredient.unit === unit.value
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {unit.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Remove button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-10 w-10"
        >
          <Trash size={16} className="text-red-500" />
        </Button>
      </div>

      {/* Nutrition information */}
      {showNutrition && ingredient.ingredientDetails && (
        <div className="mt-2 p-2 bg-muted/30 rounded-md">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">
              Nutrition per {ingredient.amount} {ingredient.unit}
            </span>
          </div>
          <NutrientDisplay
            ingredient={ingredient.ingredientDetails}
            amount={ingredient.amount}
            unit={ingredient.unit}
          />
        </div>
      )}
    </div>
  );
};

// List component to manage multiple ingredients
interface IngredientListInputProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
  showNutrition?: boolean;
}

export const IngredientListInput: React.FC<IngredientListInputProps> = ({
  ingredients,
  onChange,
  showNutrition = true,
}) => {
  const addIngredient = () => {
    const newIngredient: Ingredient = {
      name: "",
      amount: 0,
      unit: "",
    };
    onChange([...ingredients, newIngredient]);
  };

  const updateIngredient = (index: number, updatedIngredient: Ingredient) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = updatedIngredient;
    onChange(newIngredients);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onChange(newIngredients);
  };

  return (
    <div className="space-y-3">
      {ingredients.map((ingredient, index) => (
        <IngredientInput
          key={index}
          ingredient={ingredient}
          onChange={(updatedIngredient) =>
            updateIngredient(index, updatedIngredient)
          }
          onRemove={() => removeIngredient(index)}
          showNutrition={showNutrition}
        />
      ))}

      {ingredients.length === 0 && (
        <div className="text-center p-4 border border-dashed rounded-md">
          <p className="text-muted-foreground">No ingredients added yet.</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addIngredient}
        className="w-full mt-2"
      >
        <Plus size={16} className="mr-1" />
        Add Ingredient
      </Button>
    </div>
  );
};
