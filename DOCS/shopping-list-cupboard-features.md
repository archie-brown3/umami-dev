# Cupboard & Shopping List Features - Expo App

## Overview

The Recipe App includes two interconnected features that help users manage their ingredients and plan their shopping: the **Cupboard** (pantry management) and **Shopping List** (grocery planning). These features work together to create a seamless cooking workflow from planning to preparation, leveraging Expo's cross-platform capabilities for Android, iOS, and web.

## User Stories

### 🛒 Shopping List

#### Core User Stories

1. **As a user, I want to create a shopping list from my meal plan** so I can buy exactly what I need for my planned recipes.
2. **As a user, I want to manually add items to my shopping list** so I can include non-recipe items like household goods.
3. **As a user, I want to check off items as I shop** so I can track my progress through the store.
4. **As a user, I want to see estimated costs for my shopping list** so I can budget my grocery spending.
5. **As a user, I want to organize items by category** so I can shop efficiently by store section.
6. **As a user, I want to move purchased items to my cupboard** so I can track what I have at home.

#### Mobile-Specific User Stories

7. **As a user, I want to scan barcodes to add items** so I can quickly add products while shopping.
8. **As a user, I want to receive push notifications for shopping reminders** so I don't forget planned shopping trips.
9. **As a user, I want to share my shopping list with family members** so we can coordinate grocery shopping.
10. **As a user, I want to use my shopping list offline** so I can shop even without internet connection.

#### Advanced User Stories

11. **As a user, I want to see which recipes are in my shopping list** so I can remove entire recipes if plans change.
12. **As a user, I want to see recipes I can make with items in my shopping list** so I can discover new meal options.
13. **As a user, I want to mark all items as complete at once** so I can quickly finish my shopping trip.

### 🏠 Cupboard

#### Core User Stories

1. **As a user, I want to track ingredients I have at home** so I know what's available for cooking.
2. **As a user, I want to see which recipes I can make with my current ingredients** so I can cook without shopping.
3. **As a user, I want to update quantities as I use ingredients** so my cupboard stays accurate.
4. **As a user, I want to add items from my shopping list to my cupboard** so I can track new purchases.
5. **As a user, I want to organize my cupboard by categories** so I can find ingredients easily.

#### Mobile-Specific User Stories

6. **As a user, I want to take photos of my cupboard items** so I can visually track what I have.
7. **As a user, I want to get expiration notifications** so I can use ingredients before they spoil.
8. **As a user, I want to sync my cupboard across devices** so I can access it anywhere.

#### Advanced User Stories

9. **As a user, I want to see what percentage of a recipe's ingredients I have** so I can decide if it's worth making.
10. **As a user, I want to track expiration dates** so I can use ingredients before they spoil.
11. **As a user, I want to clear my entire cupboard** so I can start fresh when needed.

## Expo-Specific Technical Implementation

### Project Structure (Expo Router)

```
app/
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation layout
│   ├── index.tsx            # Home/Recipes tab
│   ├── shopping-list.tsx    # Shopping list tab
│   └── cupboard.tsx         # Cupboard tab
├── _layout.tsx              # Root layout with providers
├── +not-found.tsx           # 404 page
└── modal/
    ├── add-item.tsx         # Add item modal
    └── barcode-scanner.tsx  # Barcode scanner modal
```

### Data Models

#### Shopping List Data Structure

```typescript
interface ShoppingItem {
  id: string; // Unique identifier
  name: string; // Ingredient name
  quantity: string; // Amount needed
  unit: string; // Measurement unit
  category: string; // Store section (produce, dairy, etc.)
  checked: boolean; // Shopping completion status
  recipeId: string; // Source recipe (empty for manual items)
  emoji?: string; // Visual category indicator

  // Mobile-specific fields
  barcode?: string; // Product barcode for scanning
  imageUri?: string; // Photo taken with expo-camera
  addedViaBarcode?: boolean; // Whether added via barcode scan

  // Cost tracking
  cost?: number; // Estimated item cost
  packageSize?: string; // Package size information
  packagePrice?: number; // Full package price
  confidence?: number; // Price accuracy (0-1)
  source?: string; // Price data source
  lastUpdated?: Date; // Price data freshness
}

interface ShoppingList {
  id: string;
  title: string;
  date: string;
  items: ShoppingItem[];

  // Expo-specific fields
  sharedWith?: string[]; // User IDs for sharing
  lastSyncedAt?: Date; // Last cloud sync timestamp

  // Aggregate cost data
  totalCost?: number; // Total estimated cost
  totalPackageCost?: number; // Total package costs
  priceConfidence?: number; // Average confidence score
}
```

#### Cupboard Data Structure

```typescript
interface CupboardItem {
  id: string; // Unique identifier
  name: string; // Ingredient name
  category: string; // Storage category
  quantity: number | string; // Current amount
  unit: string; // Measurement unit
  emoji?: string; // Visual indicator
  expirationDate?: Date; // Expiry tracking
  addedDate: Date; // When added to cupboard

  // Expo-specific fields
  imageUri?: string; // Photo taken with expo-camera
  barcode?: string; // Product barcode
  notificationScheduled?: boolean; // Whether expiry notification is set
}
```

### State Management with Expo

#### Context Providers with Expo Secure Store

```typescript
// contexts/CupboardContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Secure storage helper for cross-platform persistence
const storeData = async (key: string, value: any) => {
  const jsonValue = JSON.stringify(value);

  if (Platform.OS === "web") {
    localStorage.setItem(key, jsonValue);
  } else {
    await SecureStore.setItemAsync(key, jsonValue);
  }
};

const getData = async (key: string) => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export const CupboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [cupboardItems, setCupboardItems] = useState<CupboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadCupboardData();
  }, []);

  const loadCupboardData = async () => {
    try {
      const savedData = await getData("cupboardItems");
      if (savedData) {
        setCupboardItems(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Error loading cupboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save when data changes
  useEffect(() => {
    if (!isLoading) {
      storeData("cupboardItems", cupboardItems);
    }
  }, [cupboardItems, isLoading]);

  // ... rest of context implementation
};
```

### Expo-Specific Features

#### 1. Barcode Scanning with Expo Camera

**Location**: `app/modal/barcode-scanner.tsx`

```typescript
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

export default function BarcodeScannerModal() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    // Add item to shopping list with barcode
    // This would call your shopping list context
    addItemToShoppingList({
      name: `Scanned Item (${data})`,
      quantity: "1",
      unit: "item",
      category: "Other",
      checked: false,
      recipeId: "",
      barcode: data,
      addedViaBarcode: true,
    });

    router.back();
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417", "ean13", "ean8", "upc_a", "upc_e"],
        }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.text}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
```

#### 2. Push Notifications for Expiry Alerts

**Location**: `hooks/useExpiryNotifications.ts`

```typescript
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const useExpiryNotifications = (cupboardItems: CupboardItem[]) => {
  useEffect(() => {
    registerForPushNotificationsAsync();
    scheduleExpiryNotifications(cupboardItems);
  }, [cupboardItems]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("expiry-alerts", {
        name: "Expiry Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }
    }
  };

  const scheduleExpiryNotifications = async (items: CupboardItem[]) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule new notifications for items expiring soon
    items.forEach(async (item) => {
      if (item.expirationDate && !item.notificationScheduled) {
        const expiryDate = new Date(item.expirationDate);
        const oneDayBefore = new Date(
          expiryDate.getTime() - 24 * 60 * 60 * 1000
        );

        if (oneDayBefore > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Ingredient Expiring Soon! 🥬",
              body: `${item.name} expires tomorrow. Use it in a recipe!`,
              data: { itemId: item.id, type: "expiry" },
            },
            trigger: oneDayBefore,
          });
        }
      }
    });
  };
};
```

#### 3. Image Capture for Cupboard Items

**Location**: `hooks/useImageCapture.ts`

```typescript
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export const useImageCapture = () => {
  const [isLoading, setIsLoading] = useState(false);

  const captureImage = async (): Promise<string | null> => {
    setIsLoading(true);

    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to take photos!");
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        // Save image to app's document directory
        const imageUri = result.assets[0].uri;
        const filename = `cupboard_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.copyAsync({
          from: imageUri,
          to: newPath,
        });

        return newPath;
      }
    } catch (error) {
      console.error("Error capturing image:", error);
    } finally {
      setIsLoading(false);
    }

    return null;
  };

  const pickImage = async (): Promise<string | null> => {
    setIsLoading(true);

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need photo library permissions!");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error("Error picking image:", error);
    } finally {
      setIsLoading(false);
    }

    return null;
  };

  return { captureImage, pickImage, isLoading };
};
```

#### 4. Offline Support with Expo SQLite

**Location**: `services/database.ts`

```typescript
import * as SQLite from "expo-sqlite";
import { ShoppingItem, CupboardItem } from "../types";

const db = SQLite.openDatabase("recipeApp.db");

export const initializeDatabase = () => {
  db.transaction((tx) => {
    // Shopping list table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity TEXT,
        unit TEXT,
        category TEXT,
        checked INTEGER,
        recipe_id TEXT,
        emoji TEXT,
        barcode TEXT,
        image_uri TEXT,
        cost REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );`
    );

    // Cupboard table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS cupboard_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        quantity TEXT,
        unit TEXT,
        emoji TEXT,
        expiration_date DATETIME,
        added_date DATETIME,
        image_uri TEXT,
        barcode TEXT,
        notification_scheduled INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0
      );`
    );
  });
};

export const saveShoppingItemOffline = (item: ShoppingItem): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO shopping_items 
         (id, name, quantity, unit, category, checked, recipe_id, emoji, barcode, image_uri, cost) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.quantity,
          item.unit,
          item.category,
          item.checked ? 1 : 0,
          item.recipeId,
          item.emoji,
          item.barcode,
          item.imageUri,
          item.cost,
        ],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getOfflineShoppingItems = (): Promise<ShoppingItem[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM shopping_items ORDER BY created_at DESC",
        [],
        (_, { rows }) => {
          const items = rows._array.map((row) => ({
            id: row.id,
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            category: row.category,
            checked: row.checked === 1,
            recipeId: row.recipe_id,
            emoji: row.emoji,
            barcode: row.barcode,
            imageUri: row.image_uri,
            cost: row.cost,
          }));
          resolve(items);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};
```

#### 5. Sharing with Expo Sharing

**Location**: `hooks/useSharing.ts`

```typescript
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { ShoppingList } from "../types";

export const useSharing = () => {
  const shareShoppingList = async (shoppingList: ShoppingList) => {
    try {
      // Create a formatted text version of the shopping list
      const listText = formatShoppingListForSharing(shoppingList);

      // Create a temporary file
      const filename = `shopping-list-${Date.now()}.txt`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, listText);

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Share Shopping List",
        });
      }
    } catch (error) {
      console.error("Error sharing shopping list:", error);
    }
  };

  const formatShoppingListForSharing = (shoppingList: ShoppingList): string => {
    let text = `🛒 ${shoppingList.title}\n`;
    text += `📅 ${new Date(shoppingList.date).toLocaleDateString()}\n\n`;

    // Group items by category
    const groupedItems = shoppingList.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof shoppingList.items>);

    Object.entries(groupedItems).forEach(([category, items]) => {
      text += `📂 ${category.toUpperCase()}\n`;
      items.forEach((item) => {
        const checkbox = item.checked ? "✅" : "☐";
        text += `${checkbox} ${item.quantity} ${item.unit} ${item.name}\n`;
      });
      text += "\n";
    });

    if (shoppingList.totalCost) {
      text += `💰 Estimated Total: $${shoppingList.totalCost.toFixed(2)}\n`;
    }

    text += "\n📱 Shared from Recipe App";
    return text;
  };

  return { shareShoppingList };
};
```

### Expo Router Navigation

#### Tab Layout with Shopping List and Cupboard

**Location**: `app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === "dark" ? "#fff" : "#2f95dc",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "restaurant" : "restaurant-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: "Shopping",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "basket" : "basket-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cupboard"
        options={{
          title: "Cupboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

### Performance Optimizations for Expo

#### 1. Image Optimization

```typescript
import { Image } from "expo-image";

// Use Expo Image for better performance
const CupboardItemImage = ({
  imageUri,
  itemName,
}: {
  imageUri: string;
  itemName: string;
}) => (
  <Image
    source={{ uri: imageUri }}
    style={{ width: 60, height: 60, borderRadius: 8 }}
    contentFit="cover"
    placeholder={require("../assets/placeholder.png")}
    transition={200}
    alt={`Photo of ${itemName}`}
  />
);
```

#### 2. Optimized Lists with FlashList

```typescript
import { FlashList } from "@shopify/flash-list";

const ShoppingListItems = ({ items }: { items: ShoppingItem[] }) => (
  <FlashList
    data={items}
    renderItem={({ item }) => <ShoppingListItem item={item} />}
    estimatedItemSize={80}
    keyExtractor={(item) => item.id}
    getItemType={(item) => item.category}
  />
);
```

### Expo-Specific Configuration

#### App Config (`app.json`)

```json
{
  "expo": {
    "name": "Recipe App",
    "slug": "recipe-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan barcodes and take photos of ingredients.",
        "NSPhotoLibraryUsageDescription": "This app accesses the photo library to select ingredient photos."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-camera",
      "expo-image-picker",
      "expo-notifications",
      "expo-sharing",
      "expo-sqlite"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Future Expo Enhancements

### Planned Mobile Features

1. **Apple Watch/WearOS Integration**: Quick shopping list access on wearables
2. **Siri/Google Assistant Shortcuts**: Voice commands for adding items
3. **Widget Support**: Home screen widgets for quick cupboard overview
4. **Background App Refresh**: Sync data when app is backgrounded
5. **Haptic Feedback**: Enhanced tactile feedback for interactions
6. **Face ID/Touch ID**: Secure access to shopping lists and cupboard

### Advanced Expo Integrations

1. **Expo Location**: Store-specific shopping lists based on location
2. **Expo Sensors**: Shake to add random recipe to meal plan
3. **Expo Calendar**: Integration with calendar for meal planning
4. **Expo Contacts**: Share shopping lists with contacts
5. **Expo TaskManager**: Background tasks for data synchronization

### Performance & Development

1. **Expo Development Build**: Custom development builds with native modules
2. **EAS Build**: Cloud-based builds for app store deployment
3. **EAS Update**: Over-the-air updates for quick feature releases
4. **Expo Application Services**: Comprehensive app development pipeline

This Expo-focused implementation provides a robust, cross-platform foundation for the cupboard and shopping list features while leveraging Expo's extensive ecosystem of APIs and services.
