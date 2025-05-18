import React, { useState, useRef } from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import { Command, CommandInput, CommandList, CommandItem } from "../ui/command";
import { Popover } from "../ui/popover";
import { Button } from "../ui/button";
import { IngredientDetails } from "../../types";
import { NutrientDisplay } from "./NutrientDisplay";

interface IngredientInputProps {
  onSelect: (ingredient: IngredientDetails) => void;
}

export function IngredientInput({ onSelect }: IngredientInputProps) {
  const [search, setSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientDetails | null>(null);
  const [amount, setAmount] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSearch = async (query: string) => {
    setSearch(query);
    // Implement your ingredient search logic here
  };

  const handleSelect = (ingredient: IngredientDetails) => {
    setSelectedIngredient(ingredient);
    setSearch("");
  };

  const handleAmountChange = (text: string) => {
    setAmount(text);
  };

  const handleAdd = () => {
    if (selectedIngredient && amount) {
      onSelect({
        ...selectedIngredient,
        servingSize: {
          amount: parseFloat(amount),
          unit: selectedIngredient.servingSize.unit,
        },
      });
      setSelectedIngredient(null);
      setAmount("");
    }
  };

  return (
    <View style={styles.container}>
      <Popover
        trigger={
          <Button
            variant="ghost"
            onPress={() => inputRef.current?.focus()}
            style={styles.trigger}
          >
            {selectedIngredient
              ? selectedIngredient.name
              : "Select ingredient..."}
          </Button>
        }
      >
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder="Search ingredients..."
            value={search}
            onChangeText={handleSearch}
          />
          <CommandList>
            <CommandItem
              onPress={() =>
                handleSelect({
                  id: "1",
                  name: "Test Ingredient",
                  nutrients: {
                    calories: 100,
                    protein: 10,
                    carbs: 20,
                    fat: 5,
                  },
                  servingSize: {
                    amount: 100,
                    unit: "g",
                  },
                })
              }
            >
              Test Ingredient
            </CommandItem>
          </CommandList>
        </Command>
      </Popover>

      {selectedIngredient && (
        <View style={styles.details}>
          <TextInput
            style={styles.amountInput}
            placeholder="Amount"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />
          <Text style={styles.unit}>{selectedIngredient.servingSize.unit}</Text>
          <NutrientDisplay ingredient={selectedIngredient} />
          <Button
            variant="primary"
            onPress={handleAdd}
            style={styles.addButton}
          >
            Add
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  trigger: {
    width: "100%",
    justifyContent: "flex-start",
  },
  details: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  amountInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  unit: {
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
  },
});
