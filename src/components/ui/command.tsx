import React, { forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  TextInputProps,
} from "react-native";

interface CommandProps {
  children: React.ReactNode;
  style?: any;
}

export function Command({ children, style }: CommandProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

interface CommandInputProps extends TextInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export const CommandInput = forwardRef<TextInput, CommandInputProps>(
  ({ placeholder, value, onChangeText, ...props }, ref) => {
    return (
      <View style={styles.inputContainer}>
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
      </View>
    );
  }
);

interface CommandListProps {
  children: React.ReactNode;
}

export function CommandList({ children }: CommandListProps) {
  return <View style={styles.list}>{children}</View>;
}

interface CommandItemProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function CommandItem({ children, onPress }: CommandItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
  },
  inputContainer: {
    padding: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  list: {
    marginTop: 8,
  },
  item: {
    padding: 8,
    borderRadius: 4,
  },
});
