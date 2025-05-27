import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";

interface TagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestedTags?: string[];
}

const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  onTagsChange,
  placeholder = "Add a tag...",
  maxTags = 20,
  suggestedTags = [],
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Common recipe tags for suggestions
  const defaultSuggestions = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "dessert",
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "quick",
    "easy",
    "healthy",
    "comfort",
    "spicy",
    "sweet",
    "italian",
    "mexican",
    "asian",
    "american",
    "mediterranean",
    "chicken",
    "beef",
    "seafood",
    "pasta",
    "rice",
    "soup",
    "salad",
  ];

  const allSuggestions = [
    ...new Set([...suggestedTags, ...defaultSuggestions]),
  ];

  // Filter suggestions based on input and exclude already added tags
  const filteredSuggestions = allSuggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()) &&
      inputValue.length > 0
  );

  const handleAddTag = (tagToAdd?: string) => {
    const newTag = (tagToAdd || inputValue).trim().toLowerCase();

    if (!newTag) return;

    // Check if tag already exists
    if (tags.some((tag) => tag.toLowerCase() === newTag)) {
      Alert.alert("Duplicate Tag", "This tag has already been added.");
      return;
    }

    // Check max tags limit
    if (tags.length >= maxTags) {
      Alert.alert("Tag Limit", `Maximum ${maxTags} tags allowed.`);
      return;
    }

    // Add the tag
    onTagsChange([...tags, newTag]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onTagsChange(newTags);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setShowSuggestions(text.length > 0);
  };

  const handleInputSubmit = () => {
    handleAddTag();
  };

  const handleInputFocus = () => {
    setShowSuggestions(inputValue.length > 0);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion tap
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Tags ({tags.length}/{maxTags})
      </Text>

      {/* Current Tags */}
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsContainer}
          contentContainerStyle={styles.tagsContent}
        >
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveTag(index)}
              >
                <Ionicons name="close" size={14} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          onSubmitEditing={handleInputSubmit}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {inputValue.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddTag()}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleAddTag(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
              <Ionicons name="add" size={12} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    marginBottom: spacing.sm,
  },
  tagsContent: {
    paddingRight: spacing.md,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary[700],
    fontWeight: "500",
    marginRight: spacing.xs,
  },
  removeButton: {
    padding: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.dark,
  },
  addButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
  },
  suggestionsContent: {
    paddingRight: spacing.md,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  suggestionText: {
    fontSize: 14,
    color: colors.gray[700],
    marginRight: spacing.xs,
  },
});

export default TagEditor;
