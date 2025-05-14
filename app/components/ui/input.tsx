import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

export const Input = React.forwardRef<TextInput, TextInputProps>(
  ({ style, ...props }, ref) => (
    <TextInput
      ref={ref}
      style={[styles.input, style]}
      placeholderTextColor="#888"
      {...props}
    />
  )
);

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#222",
  },
});

Input.displayName = "Input";
export default Input;
