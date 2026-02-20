import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function PerfilScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { theme, isDark } = useTheme();

  const handleLogout = () => {
    signOut();
  };

  const styles = createStyles(theme);

  const MenuItem = ({ icon, title, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={danger ? theme.colors.danger : theme.colors.textSecondary} 
        />
        <Text style={[styles.menuItemText, danger && { color: theme.colors.danger }]}>
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nome?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.nome}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {user?.tipo === 'admin' ? 'Administrador' : 'Montador'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Menu */}
        <View style={styles.section}>
          <MenuItem
            icon="person-outline"
            title="Editar Perfil"
            onPress={() => {/* TODO */}}
          />
          <MenuItem
            icon="settings-outline"
            title="Configurações"
            onPress={() => navigation.navigate('Configuracoes')}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notificações"
            onPress={() => {/* TODO */}}
          />
          <MenuItem
            icon="help-circle-outline"
            title="Ajuda"
            onPress={() => {/* TODO */}}
          />
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="log-out-outline"
            title="Sair"
            onPress={handleLogout}
            danger
          />
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
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  typeBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  typeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
});
