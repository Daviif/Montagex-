import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';

export default function ServiceCard({ service, onPress }) {
  const { theme } = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return theme.colors.warning;
      case 'em_andamento': return theme.colors.info;
      case 'concluido': return theme.colors.success;
      case 'cancelado': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.codigo}>{service.codigo}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(service.status) }]}>
              {getStatusLabel(service.status)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>

      <Text style={styles.descricao} numberOfLines={2}>
        {service.descricao || 'Sem descrição'}
      </Text>

      <View style={styles.footer}>
        <View style={styles.infoItem}>
          <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {service.cliente_nome || 'N/A'}
          </Text>
        </View>
        
        {service.data_servico && (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              {new Date(service.data_servico).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        )}
      </View>

      {service.valor_total && (
        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>Valor Total:</Text>
          <Text style={styles.value}>R$ {service.valor_total.toFixed(2)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  codigo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  descricao: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  valueLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
