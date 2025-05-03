import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../utils/supabase";
import { diagnoseSuapabaseConnection } from "../../utils/diagnostics";

// Recipe card component optimized for the home screen
function RecipeCard({
  initials,
  title,
  time,
  id,
  backgroundColor,
}: {
  initials: string;
  title: string;
  time: number;
  id: string;
  backgroundColor: string;
}) {
  return (
    <Link href={{ pathname: "/recipe/[id]", params: { id } }} asChild>
      <Pressable style={[styles.recipeCard, { backgroundColor }]}>
        <Text style={styles.recipeInitials}>{initials}</Text>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{title}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="white" />
            <Text style={styles.timeText}>{time} min</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

// Main home screen component
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run Supabase connection diagnosis when the component mounts
  useEffect(() => {
    const runDiagnosis = async () => {
      try {
        await diagnoseSuapabaseConnection();
      } catch (e) {
        console.error("Error running diagnosis:", e);
      }
    };

    runDiagnosis();
  }, []);

  // Fetch recipes from Supabase
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching recipes...");

        // Add debugging for connection issues
        if (!supabase) {
          console.error("Supabase client is not initialized");
          setError("Database connection error");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching recipes:", error);
          setError(`Database error: ${error.message}`);
        } else {
          console.log(`Successfully fetched ${data?.length || 0} recipes`);
          setRecipes(data || []);
        }
      } catch (e) {
        console.error("Unexpected error fetching recipes:", e);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Sample recipe data colors
  const colors = ["#FFB74D", "#FF8A65", "#4FC3F7", "#81C784", "#BA68C8"];

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Recipes</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text>Loading recipes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              diagnoseSuapabaseConnection(); // Run diagnostics
            }}
          >
            <Text style={styles.retryText}>Run Diagnostics</Text>
          </TouchableOpacity>
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.centered}>
          <Text>No recipes found</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.recipesGrid}>
            {filteredRecipes.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                initials={recipe.title.substring(0, 2).toUpperCase()}
                title={recipe.title}
                time={(recipe.prep_time || 0) + (recipe.cook_time || 0)}
                backgroundColor={colors[index % colors.length]}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  recipeCard: {
    width: "48%",
    height: 150,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
  },
  recipeInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  recipeInfo: {
    marginTop: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 4,
    color: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
});
