import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, createShadow } from "@/utils/styleUtils";
import { useShoppingList } from "@/context/ShoppingListContext";
import { RefreshControl } from "react-native";
import { ShoppingItem, ShoppingList } from "@/types/index";

// Define interface for component props
interface ShoppingItemProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

// Item component for individual shopping items
const ShoppingItemComponent = ({
  item,
  onToggle,
  onEdit,
  onDelete,
}: ShoppingItemProps) => {
  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggle(item.id, !item.checked)}
      >
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        {(item.quantity || item.unit) && (
          <Text style={styles.itemDetails}>
            {item.quantity}
            {item.unit && ` ${item.unit}`}
          </Text>
        )}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="pencil" size={20} color={colors.gray[500]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.gray[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (listId: string, item: Partial<ShoppingItem>) => Promise<void>;
  onUpdate: (itemId: string, updates: Partial<ShoppingItem>) => Promise<void>;
  selectedList?: string;
  editItem: ShoppingItem | null;
}

// Add Item Form Modal
const AddItemModal = ({
  visible,
  onClose,
  onAdd,
  selectedList,
  editItem,
  onUpdate,
}: AddItemModalProps) => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  // Pre-fill form when editing an existing item
  React.useEffect(() => {
    if (editItem) {
      setItemName(editItem.name);
      setQuantity(editItem.quantity || "");
      setUnit(editItem.unit || "");
      setCategory(editItem.category || "");
    } else {
      setItemName("");
      setQuantity("");
      setUnit("");
      setCategory("");
    }
  }, [editItem]);

  const handleSubmit = () => {
    if (!itemName.trim()) {
      Alert.alert("Required", "Please enter an item name");
      return;
    }

    const itemData: Partial<ShoppingItem> = {
      name: itemName.trim(),
      quantity: quantity.trim() || undefined,
      unit: unit.trim() || undefined,
      category: category.trim() || undefined,
    };

    if (editItem) {
      onUpdate(editItem.id, itemData);
    } else if (selectedList) {
      onAdd(selectedList, itemData);
    }

    onClose();
  };

  const categories = [
    "Produce",
    "Dairy",
    "Meat",
    "Bakery",
    "Pantry",
    "Frozen",
    "Beverages",
    "Household",
    "Other",
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editItem ? "Edit Item" : "Add Item"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Name*</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="Enter item name"
              autoFocus
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 2"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1.5 }]}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g. cups"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.selectedCategoryChip,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.selectedCategoryChipText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {editItem ? "Save Changes" : "Add Item"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

interface ListSelectorProps {
  lists: ShoppingList[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAddList: (name: string) => Promise<void>;
  onRenameList: (id: string, name: string) => Promise<void>;
  onDeleteList: (id: string) => Promise<void>;
}

// List Selector Component
const ListSelector = ({
  lists,
  selectedId,
  onSelect,
  onAddList,
  onRenameList,
  onDeleteList,
}: ListSelectorProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [listToRename, setListToRename] = useState<ShoppingList | null>(null);

  const handleAddList = () => {
    if (newListName.trim()) {
      onAddList(newListName.trim());
      setNewListName("");
      setIsAdding(false);
    }
  };

  const handleRenameList = () => {
    if (newListName.trim() && listToRename) {
      onRenameList(listToRename.id, newListName.trim());
      setNewListName("");
      setListToRename(null);
      setIsRenaming(false);
    }
  };

  const startRename = (list: ShoppingList) => {
    setListToRename(list);
    setNewListName(list.name);
    setIsRenaming(true);
  };

  const confirmDeleteList = (list: ShoppingList) => {
    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${list.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => onDeleteList(list.id),
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View style={styles.listSelectorContainer}>
      <View style={styles.listHeaderContainer}>
        <Text style={styles.listSelectorTitle}>My Lists</Text>
        <TouchableOpacity
          style={styles.addListButton}
          onPress={() => setIsAdding(true)}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.newListForm}>
          <TextInput
            style={styles.newListInput}
            value={newListName}
            onChangeText={setNewListName}
            placeholder="List name"
            autoFocus
          />
          <TouchableOpacity onPress={handleAddList}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsAdding(false)}>
            <Ionicons name="close-circle" size={28} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>
      )}

      {isRenaming && (
        <View style={styles.newListForm}>
          <TextInput
            style={styles.newListInput}
            value={newListName}
            onChangeText={setNewListName}
            placeholder="New list name"
            autoFocus
          />
          <TouchableOpacity onPress={handleRenameList}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsRenaming(false)}>
            <Ionicons name="close-circle" size={28} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={lists}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listChipsContainer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listChipWrapper}>
            <TouchableOpacity
              style={[
                styles.listChip,
                selectedId === item.id && styles.selectedListChip,
              ]}
              onPress={() => onSelect(item.id)}
            >
              <Text
                style={[
                  styles.listChipText,
                  selectedId === item.id && styles.selectedListChipText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>

            <View style={styles.listChipActions}>
              <TouchableOpacity onPress={() => startRename(item)}>
                <Ionicons name="pencil" size={16} color={colors.gray[500]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteList(item)}>
                <Ionicons name="trash" size={16} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyListChip}>
            <Text style={styles.emptyListText}>No lists yet</Text>
          </View>
        }
      />
    </View>
  );
};

// Main component
export default function ShoppingScreen() {
  const {
    shoppingLists,
    currentListItems,
    currentListId,
    loading,
    error,
    fetchShoppingLists,
    fetchShoppingItems,
    createList,
    updateList,
    deleteList,
    addItemToList,
    updateItem,
    deleteItem,
    clearCheckedItems,
    setCurrentListId,
  } = useShoppingList();

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShoppingLists();
    if (currentListId) {
      await fetchShoppingItems(currentListId);
    }
    setRefreshing(false);
  }, [fetchShoppingLists, fetchShoppingItems, currentListId]);

  // Group items by category and sort checked items to the bottom
  const organizedItems = React.useMemo(() => {
    if (!currentListItems || currentListItems.length === 0) {
      return [];
    }

    // Copy and sort items
    return [...currentListItems].sort((a, b) => {
      // First sort by checked status
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1;
      }

      // Then sort by category (alphabetically)
      const catA = a.category || "Uncategorized";
      const catB = b.category || "Uncategorized";
      if (catA !== catB) {
        return catA.localeCompare(catB);
      }

      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  }, [currentListItems]);

  // Get counts for empty state and display
  const checkedCount =
    currentListItems?.filter((item) => item.checked)?.length || 0;
  const totalCount = currentListItems?.length || 0;

  // Functions to handle CRUD operations
  const handleAddItem = async (
    listId: string,
    itemData: Partial<ShoppingItem>
  ) => {
    await addItemToList(listId, itemData);
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<ShoppingItem>
  ) => {
    await updateItem(itemId, updates);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => deleteItem(itemId),
        style: "destructive",
      },
    ]);
  };

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    await updateItem(itemId, { checked });
  };

  const handleClearChecked = () => {
    if (checkedCount > 0) {
      Alert.alert(
        "Clear Completed Items",
        "Are you sure you want to remove all checked items?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear",
            onPress: () => currentListId && clearCheckedItems(currentListId),
            style: "destructive",
          },
        ]
      );
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setItemModalVisible(true);
  };

  const handleAddList = async (name: string) => {
    await createList(name);
  };

  const handleRenameList = async (listId: string, name: string) => {
    await updateList(listId, name);
  };

  const handleDeleteList = async (listId: string) => {
    await deleteList(listId);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Lists</Text>
      </View>

      <ListSelector
        lists={shoppingLists}
        selectedId={currentListId}
        onSelect={setCurrentListId}
        onAddList={handleAddList}
        onRenameList={handleRenameList}
        onDeleteList={handleDeleteList}
      />

      {/* Main content */}
      <View style={styles.content}>
        {loading && shoppingLists.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading shopping lists...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.red[500]}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : shoppingLists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyStateTitle}>No Shopping Lists Yet</Text>
            <Text style={styles.emptyStateMessage}>
              Create a shopping list to get started
            </Text>
          </View>
        ) : !currentListId ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyStateTitle}>Select a List</Text>
            <Text style={styles.emptyStateMessage}>
              Choose a shopping list from above or create a new one
            </Text>
          </View>
        ) : (
          <>
            {/* List header actions */}
            <View style={styles.listActionsContainer}>
              <View style={styles.listStats}>
                <Text style={styles.listStatsText}>
                  {checkedCount} of {totalCount} items checked
                </Text>
              </View>

              {checkedCount > 0 && (
                <TouchableOpacity
                  style={styles.clearCheckedButton}
                  onPress={handleClearChecked}
                >
                  <Text style={styles.clearCheckedText}>Clear checked</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Items list */}
            <FlatList
              data={organizedItems}
              style={styles.itemsList}
              contentContainerStyle={styles.itemsListContent}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ShoppingItemComponent
                  item={item}
                  onToggle={handleToggleItem}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyListState}>
                  <Ionicons
                    name="cart-outline"
                    size={48}
                    color={colors.gray[300]}
                  />
                  <Text style={styles.emptyListText}>Your list is empty</Text>
                  <Text style={styles.emptyListSubtext}>
                    Add items to your shopping list
                  </Text>
                </View>
              }
              ItemSeparatorComponent={() => (
                <View style={styles.itemSeparator} />
              )}
            />

            {/* Add item button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingItem(null);
                setItemModalVisible(true);
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Add/Edit Item Modal */}
      <AddItemModal
        visible={itemModalVisible}
        onClose={() => {
          setItemModalVisible(false);
          setEditingItem(null);
        }}
        onAdd={handleAddItem}
        onUpdate={handleUpdateItem}
        selectedList={currentListId}
        editItem={editingItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "bold",
    color: colors.dark,
  },
  listSelectorContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    ...createShadow(3),
  },
  listHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  listSelectorTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
    color: colors.gray[700],
  },
  addListButton: {
    padding: spacing.xs,
  },
  listChipsContainer: {
    paddingVertical: spacing.xs,
  },
  listChipWrapper: {
    marginRight: spacing.md,
  },
  listChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[200],
    borderRadius: 20,
    marginBottom: spacing.xs,
  },
  selectedListChip: {
    backgroundColor: colors.primary,
  },
  listChipText: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[700],
  },
  selectedListChipText: {
    color: colors.white,
  },
  listChipActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  emptyListChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  emptyListText: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[500],
  },
  newListForm: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  newListInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.red[500],
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "bold",
    color: colors.gray[700],
    marginTop: spacing.md,
  },
  emptyStateMessage: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
  },
  listActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  listStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  listStatsText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
  },
  clearCheckedButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
  },
  clearCheckedText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    padding: spacing.md,
    paddingBottom: 80, // Extra padding for the FAB
  },
  emptyListState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyListSubtext: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[500],
    marginTop: spacing.xs,
    textAlign: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    ...createShadow(2),
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSizes.md,
    fontWeight: "500",
    color: colors.gray[800],
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: colors.gray[500],
  },
  itemDetails: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[700],
  },
  itemSeparator: {
    height: spacing.sm,
  },
  addButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...createShadow(4),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    ...createShadow(10),
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "bold",
    color: colors.dark,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizes.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
  },
  selectedCategoryChipText: {
    color: colors.white,
  },
});
