import { StyleSheet, View, Text, ScrollView } from "react-native";

export default function MealPlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Meal Planning</Text>

      <ScrollView>
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonText}>Coming Soon!</Text>
          <Text style={styles.descriptionText}>
            Meal planning features will be available in a future update. Plan
            your meals for the week, generate shopping lists, and track
            nutritional information.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  comingSoonContainer: {
    padding: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 50,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8AB39F",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
