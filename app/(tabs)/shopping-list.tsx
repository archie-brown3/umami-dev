import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useShoppingList } from "@/context/ShoppingListContext";
import { Check, Trash2, Plus } from "lucide-react";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function ShoppingListScreen() {
  const {
    currentList,
    items,
    loading,
    error,
    addItem,
    toggleItemCheck,
    deleteItem,
  } = useShoppingList();

  const [newItemName, setNewItemName] = useState("");
  const colorScheme = useColorScheme();

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    await addItem({
      name: newItemName,
      quantity: "1",
      unit: "",
      category: "other",
      checked: false,
    });

    setNewItemName("");
  };

  if (loading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={{ flex: 1, padding: 16 }}>
        <ThemedText style={{ color: "red" }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <ThemedText type="title">Groceries</ThemedText>
        {currentList && (
          <ThemedText style={{ marginTop: 4, opacity: 0.7 }}>
            {new Date(currentList.date).toLocaleDateString()}
          </ThemedText>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: Colors[colorScheme].text + "20",
            }}
          >
            <TouchableOpacity
              onPress={() => toggleItemCheck(item.id)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: Colors[colorScheme].tint,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: item.checked
                  ? Colors[colorScheme].tint
                  : "transparent",
              }}
            >
              {item.checked && <Check size={16} color="#FFF" />}
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText
                style={{
                  textDecorationLine: item.checked ? "line-through" : "none",
                  opacity: item.checked ? 0.5 : 1,
                }}
              >
                {item.name}
              </ThemedText>
              {item.quantity && item.unit && (
                <ThemedText
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  {item.quantity} {item.unit}
                </ThemedText>
              )}
            </View>

            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={{ padding: 8 }}
            >
              <Trash2
                size={20}
                color={Colors[colorScheme].text}
                opacity={0.5}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme].text + "20",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Add item..."
          placeholderTextColor={Colors[colorScheme].text + "50"}
          style={{
            flex: 1,
            height: 40,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: Colors[colorScheme].text + "10",
            color: Colors[colorScheme].text,
          }}
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity
          onPress={handleAddItem}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors[colorScheme].tint,
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 8,
          }}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
