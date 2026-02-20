import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';

export default function ConfiguracoesScreen() {
  const { theme, isDark, themeMode, toggleTheme } = useTheme();

  const styles = createStyles(theme);

  const ThemeOption = ({ mode, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        themeMode === mode && styles.themeOptionActive,
      ]}
      onPress={() => toggleTheme(mode)}
    >
      <View style={styles.themeOptionContent}>
        <Ionicons
          name={icon}
          size={24}
          color={themeMode === mode ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.themeOptionText,
            themeMode === mode && styles.themeOptionTextActive,
          ]}
        >
          {label}
        </Text>
      </View>
      {themeMode === mode && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          <ThemeOption mode="light" label="Claro" icon="sunny" />
          <ThemeOption mode="dark" label="Escuro" icon="moon" />
          <ThemeOption mode="auto" label="Automático" icon="phone-portrait" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versão</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>1</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  themeOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
