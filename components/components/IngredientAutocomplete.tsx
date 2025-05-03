import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { Combobox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Loader2 } from "lucide-react";
import { searchIngredients } from "@/services/nutrition/nutritionService";
import { Ingredient } from "@/services/nutrition/nutritionService";

interface IngredientAutocompleteProps {
  value: string;
  onChange: (value: string, ingredientData?: Ingredient) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function IngredientAutocomplete({
  value,
  onChange,
  placeholder = "Search ingredients...",
  className = "",
  required = false,
  disabled = false,
}: IngredientAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue] = useDebounce(inputValue, 300);
  const [options, setOptions] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!debouncedValue.trim() || debouncedValue.length < 2) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const results = await searchIngredients(debouncedValue);
        if (mounted.current) {
          setOptions(results);
        }
      } catch (error) {
        console.error("Error searching ingredients:", error);
        if (mounted.current) {
          setOptions([]);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchOptions();
  }, [debouncedValue]);

  // Reset options when closed
  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const handleSelect = (selected: string | Ingredient) => {
    if (typeof selected === "string") {
      setInputValue(selected);
      onChange(selected);
    } else {
      setInputValue(selected.name);
      onChange(selected.name, selected);
    }
    setOpen(false);
  };

  return (
    <Combobox
      as="div"
      value={inputValue}
      onChange={handleSelect}
      disabled={disabled}
      className={`relative ${className}`}
    >
      <div className="relative w-full">
        <Combobox.Input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          required={required}
          onFocus={() => setOpen(true)}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          )}
        </Combobox.Button>
      </div>

      <Combobox.Options
        className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${
          !open || options.length === 0 ? "hidden" : ""
        }`}
      >
        {options.length === 0 && debouncedValue !== "" && !isLoading ? (
          <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
            No ingredients found.
          </div>
        ) : (
          options.map((option) => (
            <Combobox.Option
              key={`${option.source}-${option.id}`}
              value={option}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                  active ? "bg-primary text-white" : "text-gray-900"
                }`
              }
            >
              {({ selected, active }) => (
                <>
                  <span
                    className={`block truncate ${
                      selected ? "font-medium" : "font-normal"
                    }`}
                  >
                    {option.name}
                    <span className="ml-2 text-xs text-gray-500">
                      {option.source === "usda" ? "USDA" : "Spoon"}
                    </span>
                  </span>
                  {selected ? (
                    <span
                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                        active ? "text-white" : "text-primary"
                      }`}
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : null}
                </>
              )}
            </Combobox.Option>
          ))
        )}
      </Combobox.Options>
    </Combobox>
  );
}
