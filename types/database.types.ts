export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cupboard_items: {
        Row: {
          added_date: string
          category: string | null
          emoji: string | null
          expiration_date: string | null
          id: string
          name: string
          quantity: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_date?: string
          category?: string | null
          emoji?: string | null
          expiration_date?: string | null
          id?: string
          name: string
          quantity?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_date?: string
          category?: string | null
          emoji?: string | null
          expiration_date?: string | null
          id?: string
          name?: string
          quantity?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cupboard_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string | null
          created_at: string
          emoji: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_plan_items: {
        Row: {
          created_at: string
          id: string
          meal_plan_id: string
          meal_type: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_plan_id: string
          meal_type: string
          recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_plan_id?: string
          meal_type?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          ingredient_id: string
          package_price: number | null
          package_size: string | null
          portion_used: number | null
          price_confidence: number | null
          quantity: string
          recipe_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          ingredient_id: string
          package_price?: number | null
          package_size?: string | null
          portion_used?: number | null
          price_confidence?: number | null
          quantity: string
          recipe_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          ingredient_id?: string
          package_price?: number | null
          package_size?: string | null
          portion_used?: number | null
          price_confidence?: number | null
          quantity?: string
          recipe_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_list_items: {
        Row: {
          added_at: string
          recipe_id: string
          recipe_list_id: string
        }
        Insert: {
          added_at?: string
          recipe_id: string
          recipe_list_id: string
        }
        Update: {
          added_at?: string
          recipe_id?: string
          recipe_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_list_items_recipe_list_id_fkey"
            columns: ["recipe_list_id"]
            isOneToOne: false
            referencedRelation: "recipe_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_lists: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_media: {
        Row: {
          created_at: string
          id: string
          is_video: boolean | null
          order_index: number
          recipe_id: string
          url: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_video?: boolean | null
          order_index?: number
          recipe_id: string
          url: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_video?: boolean | null
          order_index?: number
          recipe_id?: string
          url?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_media_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_nutrition: {
        Row: {
          calories: number | null
          carbs: string | null
          created_at: string
          fat: string | null
          fiber: string | null
          id: string
          protein: string | null
          recipe_id: string
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs?: string | null
          created_at?: string
          fat?: string | null
          fiber?: string | null
          id?: string
          protein?: string | null
          recipe_id: string
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs?: string | null
          created_at?: string
          fat?: string | null
          fiber?: string | null
          id?: string
          protein?: string | null
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_nutrition_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string
          id: string
          instruction: string
          recipe_id: string
          step_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instruction: string
          recipe_id: string
          step_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instruction?: string
          recipe_id?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          recipe_id: string
          tag_id: string
        }
        Insert: {
          recipe_id: string
          tag_id: string
        }
        Update: {
          recipe_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author: string | null
          category: string | null
          cook_time: number | null
          cost_per_serving: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          instagram_profile_picture: string | null
          instagram_username: string | null
          is_favorite: boolean | null
          is_saved: boolean | null
          prep_time: number | null
          price_confidence: number | null
          servings: number
          source: string | null
          source_url: string | null
          status: string | null
          title: string
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instagram_profile_picture?: string | null
          instagram_username?: string | null
          is_favorite?: boolean | null
          is_saved?: boolean | null
          prep_time?: number | null
          price_confidence?: number | null
          servings?: number
          source?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          cook_time?: number | null
          cost_per_serving?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instagram_profile_picture?: string | null
          instagram_username?: string | null
          is_favorite?: boolean | null
          is_saved?: boolean | null
          prep_time?: number | null
          price_confidence?: number | null
          servings?: number
          source?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          category: string | null
          checked: boolean | null
          cost: number | null
          created_at: string
          emoji: string | null
          id: string
          ingredient_id: string | null
          name: string
          package_cost: number | null
          package_price: number | null
          price_confidence: number | null
          quantity: string | null
          recipe_id: string | null
          shopping_list_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          checked?: boolean | null
          cost?: number | null
          created_at?: string
          emoji?: string | null
          id?: string
          ingredient_id?: string | null
          name: string
          package_cost?: number | null
          package_price?: number | null
          price_confidence?: number | null
          quantity?: string | null
          recipe_id?: string | null
          shopping_list_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          checked?: boolean | null
          cost?: number | null
          created_at?: string
          emoji?: string | null
          id?: string
          ingredient_id?: string | null
          name?: string
          package_cost?: number | null
          package_price?: number | null
          price_confidence?: number | null
          quantity?: string | null
          recipe_id?: string | null
          shopping_list_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          date: string
          id: string
          price_confidence: number | null
          title: string
          total_cost: number | null
          total_package_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          price_confidence?: number | null
          title: string
          total_cost?: number | null
          total_package_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          price_confidence?: number | null
          title?: string
          total_cost?: number | null
          total_package_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          extractions_remaining: number | null
          id: string
          tier: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          extractions_remaining?: number | null
          id?: string
          tier: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          extractions_remaining?: number | null
          id?: string
          tier?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      force_insert_recipe: {
        Args: {
          p_id: string
          p_user_id: string
          p_title: string
          p_description?: string
        }
        Returns: boolean
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
