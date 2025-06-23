/**
 * Simple event emitter for app-wide events
 * Used to trigger refreshes when data changes
 */

import { Recipe } from "@/types";

type EventCallback = (...args: any[]) => void;

class CustomEventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error);
      }
    });
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Global event emitter instance
export const eventEmitter = new CustomEventEmitter();

// Debounce mechanism to prevent rapid-fire events
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

// Predefined event types for type safety
export const EVENTS = {
  RECIPE_CREATED: "recipe:created",
  RECIPE_UPDATED: "recipe:updated",
  RECIPE_DELETED: "recipe:deleted",
  RECIPES_REFRESH: "recipes:refresh",
  SHOPPING_LIST_UPDATED: "shopping_list:updated",
} as const;

// Helper function to emit refresh with debouncing
const emitRefreshDebounced = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  refreshTimeout = setTimeout(() => {
    console.log("[EventEmitter] Emitting debounced refresh event");
    eventEmitter.emit(EVENTS.RECIPES_REFRESH);
    refreshTimeout = null;
  }, 100); // 100ms debounce
};

// Helper functions for common events
export const emitRecipeCreated = (recipe: Recipe) => {
  console.log("[EventEmitter] Recipe created, triggering refresh");
  eventEmitter.emit(EVENTS.RECIPE_CREATED, recipe);
  emitRefreshDebounced();
};

export const emitRecipeUpdated = (recipe: Recipe | string) => {
  console.log("[EventEmitter] Recipe updated, triggering refresh");
  eventEmitter.emit(EVENTS.RECIPE_UPDATED, recipe);
  emitRefreshDebounced();
};

export const emitRecipeDeleted = (recipeId: string) => {
  console.log("[EventEmitter] Recipe deleted, triggering refresh");
  eventEmitter.emit(EVENTS.RECIPE_DELETED, recipeId);
  emitRefreshDebounced();
};

export const emitRecipesRefresh = () => {
  eventEmitter.emit(EVENTS.RECIPES_REFRESH);
};
