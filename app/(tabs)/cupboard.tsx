import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SectionList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, createShadow } from "@/utils/styleUtils";
import { useCupboard } from "@/context/CupboardContext";
import { RefreshControl } from "react-native";
import { InventoryItem } from "@/types/index";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

// Item component for individual cupboard items
const CupboardItem = ({
  item,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}) => {
  const isExpiringSoon =
    item.expiration_date &&
    isBefore(parseISO(item.expiration_date), addDays(new Date(), 7)) &&
    isAfter(parseISO(item.expiration_date), new Date());

  const isExpired =
    item.expiration_date &&
    isBefore(parseISO(item.expiration_date), new Date());

  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        isExpiringSoon && styles.itemExpiringSoon,
        isExpired && styles.itemExpired,
      ]}
      onPress={() => onEdit(item)}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
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
        {item.expiration_date && (
          <View
            style={[
              styles.expirationBadge,
              isExpiringSoon && styles.expirationSoon,
              isExpired && styles.expirationExpired,
            ]}
          >
            <Text
              style={[
                styles.expirationText,
                isExpiringSoon && styles.expirationSoonText,
                isExpired && styles.expirationExpiredText,
              ]}
            >
              {isExpired
                ? "Expired"
                : isExpiringSoon
                ? "Expires Soon"
                : `Exp: ${format(
                    parseISO(item.expiration_date),
                    "MMM d, yyyy"
                  )}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.gray[500]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Add/Edit Item Modal
const AddItemModal = ({
  visible,
  onClose,
  onAdd,
  editItem,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Partial<InventoryItem>) => Promise<void>;
  editItem: InventoryItem | null;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
}) => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  // Pre-fill form when editing an existing item
  React.useEffect(() => {
    if (editItem) {
      setItemName(editItem.name);
      setQuantity(editItem.quantity || "");
      setUnit(editItem.unit || "");
      setCategory(editItem.category || "");
      setExpirationDate(editItem.expiration_date || "");
    } else {
      setItemName("");
      setQuantity("");
      setUnit("");
      setCategory("");
      setExpirationDate("");
    }
  }, [editItem]);

  const handleSubmit = () => {
    if (!itemName.trim()) {
      Alert.alert("Required", "Please enter an item name");
      return;
    }

    // Validate expiration date format if provided (YYYY-MM-DD)
    if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
      Alert.alert(
        "Invalid Date",
        "Please use YYYY-MM-DD format for expiration date"
      );
      return;
    }

    const itemData = {
      name: itemName.trim(),
      quantity: quantity.trim() || undefined,
      unit: unit.trim() || undefined,
      category: category.trim() || undefined,
      expiration_date: expirationDate.trim() || undefined,
    };

    if (editItem) {
      onUpdate(editItem.id, itemData);
    } else {
      onAdd(itemData);
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Expiration Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={expirationDate}
              onChangeText={setExpirationDate}
              placeholder="e.g. 2023-12-31"
            />
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

// Filter Bar Component
const FilterBar = ({
  activeCategory,
  onCategoryChange,
  categories,
}: {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}) => {
  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            activeCategory === "all" && styles.activeFilterChip,
          ]}
          onPress={() => onCategoryChange("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategory === "all" && styles.activeFilterChipText,
            ]}
          >
            All Items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeCategory === "expiring" && styles.activeFilterChip,
          ]}
          onPress={() => onCategoryChange("expiring")}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategory === "expiring" && styles.activeFilterChipText,
            ]}
          >
            Expiring Soon
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              activeCategory === category && styles.activeFilterChip,
            ]}
            onPress={() => onCategoryChange(category)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeCategory === category && styles.activeFilterChipText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Main component
export default function CupboardScreen() {
  const {
    inventoryItems,
    loading,
    error,
    fetchInventoryItems,
    addItem,
    updateItem,
    deleteItem,
    getExpiringItems,
  } = useCupboard();

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Function to handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventoryItems();
    setRefreshing(false);
  }, [fetchInventoryItems]);

  // Extract unique categories from items
  const categories = useMemo(() => {
    if (!inventoryItems) return [];

    const categorySet = new Set(
      inventoryItems
        .map((item) => item.category)
        .filter((category): category is string => category !== undefined)
    );

    return Array.from(categorySet);
  }, [inventoryItems]);

  // Filter and group items
  const processedItems = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) {
      return [];
    }

    let filteredItems = [...inventoryItems];

    // Apply category filter
    if (activeCategory === "expiring") {
      filteredItems = filteredItems.filter(
        (item) =>
          item.expiration_date &&
          isBefore(parseISO(item.expiration_date), addDays(new Date(), 7)) &&
          isAfter(parseISO(item.expiration_date), new Date())
      );
    } else if (activeCategory !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.category === activeCategory
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
      );
    }

    // Group items by expiration status
    const expired: InventoryItem[] = [];
    const expiringSoon: InventoryItem[] = [];
    const normal: InventoryItem[] = [];

    filteredItems.forEach((item) => {
      if (item.expiration_date) {
        if (isBefore(parseISO(item.expiration_date), new Date())) {
          expired.push(item);
        } else if (
          isBefore(parseISO(item.expiration_date), addDays(new Date(), 7))
        ) {
          expiringSoon.push(item);
        } else {
          normal.push(item);
        }
      } else {
        normal.push(item);
      }
    });

    // Prepare sections
    const sections = [];

    if (expired.length > 0) {
      sections.push({
        title: "Expired",
        data: expired.sort((a, b) => {
          if (!a.expiration_date || !b.expiration_date) return 0;
          return a.expiration_date.localeCompare(b.expiration_date);
        }),
      });
    }

    if (expiringSoon.length > 0) {
      sections.push({
        title: "Expiring Soon",
        data: expiringSoon.sort((a, b) => {
          if (!a.expiration_date || !b.expiration_date) return 0;
          return a.expiration_date.localeCompare(b.expiration_date);
        }),
      });
    }

    if (normal.length > 0) {
      sections.push({
        title: "Cupboard Items",
        data: normal.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    return sections;
  }, [inventoryItems, activeCategory, searchQuery]);

  // Functions to handle CRUD operations
  const handleAddItem = async (itemData: Partial<InventoryItem>) => {
    await addItem(itemData);
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<InventoryItem>
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

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cupboard</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.gray[500]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      {categories.length > 0 && (
        <FilterBar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />
      )}

      {/* Main content */}
      <View style={styles.content}>
        {loading && inventoryItems.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading cupboard items...</Text>
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
        ) : inventoryItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="basket-outline"
              size={64}
              color={colors.gray[300]}
            />
            <Text style={styles.emptyStateTitle}>Your Cupboard is Empty</Text>
            <Text style={styles.emptyStateMessage}>
              Add items to keep track of what you have at home
            </Text>
          </View>
        ) : processedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={64}
              color={colors.gray[300]}
            />
            <Text style={styles.emptyStateTitle}>No Matching Items</Text>
            <Text style={styles.emptyStateMessage}>
              Try changing your search or filter
            </Text>
          </View>
        ) : (
          <SectionList
            sections={processedItems}
            style={styles.itemsList}
            contentContainerStyle={styles.itemsListContent}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CupboardItem
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            )}
            renderSectionHeader={({ section: { title, data } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionCount}>{data.length} items</Text>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            stickySectionHeadersEnabled={true}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        )}

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    margin: spacing.md,
    marginTop: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.gray[800],
    paddingVertical: Platform.OS === "ios" ? spacing.xs : 0,
  },
  filterContainer: {
    backgroundColor: colors.white,
    ...createShadow(2),
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[200],
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
  },
  activeFilterChipText: {
    color: colors.white,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
    color: colors.gray[800],
  },
  sectionCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[500],
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    paddingBottom: 80, // Extra padding for the FAB
  },
  itemSeparator: {
    height: spacing.sm,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...createShadow(2),
  },
  itemExpiringSoon: {
    borderLeftWidth: 4,
    borderLeftColor: colors.green[500],
  },
  itemExpired: {
    borderLeftWidth: 4,
    borderLeftColor: colors.red[500],
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
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[700],
  },
  expirationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    backgroundColor: colors.gray[200],
  },
  expirationSoon: {
    backgroundColor: colors.green[500],
  },
  expirationExpired: {
    backgroundColor: colors.red[500],
  },
  expirationText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[700],
  },
  expirationSoonText: {
    color: colors.green[600],
  },
  expirationExpiredText: {
    color: colors.red[600],
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
