import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <View>{children}</View>;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
}: DropdownMenuTriggerProps) {
  const Content = () => <>{children}</>;

  if (asChild) {
    return <Content />;
  }

  return <View>{children}</View>;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = "center",
  className,
}: DropdownMenuContentProps) {
  return (
    <View
      style={[
        styles.content,
        align === "start"
          ? styles.alignStart
          : align === "end"
          ? styles.alignEnd
          : styles.alignCenter,
      ]}
    >
      {children}
    </View>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
}

export function DropdownMenuItem({
  children,
  onSelect,
}: DropdownMenuItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onSelect}>
      {children}
    </TouchableOpacity>
  );
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
}

export function DropdownMenuLabel({ children }: DropdownMenuLabelProps) {
  return (
    <View style={styles.label}>
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

export function DropdownMenuSeparator() {
  return <View style={styles.separator} />;
}

interface DropdownMenuGroupProps {
  children: React.ReactNode;
}

export function DropdownMenuGroup({ children }: DropdownMenuGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

interface DropdownMenuShortcutProps {
  children: React.ReactNode;
}

export function DropdownMenuShortcut({ children }: DropdownMenuShortcutProps) {
  return (
    <View style={styles.shortcut}>
      <Text style={styles.shortcutText}>{children}</Text>
    </View>
  );
}

interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  return <View>{children}</View>;
}

interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
}

export function DropdownMenuSubTrigger({
  children,
}: DropdownMenuSubTriggerProps) {
  return (
    <TouchableOpacity style={styles.subTrigger}>{children}</TouchableOpacity>
  );
}

interface DropdownMenuSubContentProps {
  children: React.ReactNode;
}

export function DropdownMenuSubContent({
  children,
}: DropdownMenuSubContentProps) {
  return <View style={styles.subContent}>{children}</View>;
}

// Actual implementation of the dropdown
export function DropdownMenuComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Text>Open Dropdown</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdown}>
            {/* Dropdown content goes here */}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alignStart: {
    alignSelf: "flex-start",
  },
  alignCenter: {
    alignSelf: "center",
  },
  alignEnd: {
    alignSelf: "flex-end",
  },
  item: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    padding: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  separator: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 6,
  },
  group: {
    padding: 6,
  },
  shortcut: {
    marginLeft: "auto",
  },
  shortcutText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  subTrigger: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subContent: {
    padding: 8,
    marginLeft: 16,
  },
});
