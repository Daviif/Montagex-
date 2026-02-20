import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import ServiceCard from '../components/ServiceCard';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [stats, setStats] = useState(null);
  const [recentServices, setRecentServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carrega estatísticas
      const [statsResponse, servicesResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/servicos', { params: { limit: 5 } }),
      ]);

      setStats(statsResponse.data);
      setRecentServices(servicesResponse.data.servicos || servicesResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.nome?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Bem-vindo ao Montagex</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {/* TODO: Implementar notificações */}}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Serviços Hoje"
            value={stats?.servicosHoje || 0}
            icon="briefcase"
            color={theme.colors.primary}
          />
          <StatCard
            title="Em Andamento"
            value={stats?.servicosAndamento || 0}
            icon="hourglass"
            color={theme.colors.warning}
          />
          <StatCard
            title="Concluídos Mês"
            value={stats?.servicosMes || 0}
            icon="checkmark-circle"
            color={theme.colors.success}
          />
          <StatCard
            title="Faturamento Mês"
            value={`R$ ${(stats?.faturamentoMes || 0).toLocaleString('pt-BR')}`}
            icon="cash"
            color={theme.colors.info}
            isMonetary
          />
        </View>

        {/* Serviços Recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Serviços Recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Servicos')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentServices.length > 0 ? (
            recentServices.map((servico) => (
              <ServiceCard
                key={servico.id}
                service={servico}
                onPress={() => navigation.navigate('ServicoDetalhes', { id: servico.id })}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhum serviço encontrado</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botão de Novo Serviço */}
      {user?.tipo === 'admin' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NovoServico')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
});
