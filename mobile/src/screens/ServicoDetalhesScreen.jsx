import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

export default function ServicoDetalhesScreen({ route, navigation }) {
  const { id } = route.params;
  const { theme, isDark } = useTheme();

  const [servico, setServico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clienteNome, setClienteNome] = useState('N/A');

  const parseCurrency = (value) => {
    if (value == null) return 0;
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    loadServico();
  }, [id]);

  const loadServico = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/servicos/${id}`);
      const servicoData = response.data;
      setServico(servicoData);

      const nomeDireto = servicoData?.cliente_nome || servicoData?.cliente_final_nome;
      if (nomeDireto) {
        setClienteNome(nomeDireto);
      } else if (servicoData?.tipo_cliente === 'loja' && servicoData?.loja_id) {
        try {
          const lojaResponse = await api.get(`/lojas/${servicoData.loja_id}`);
          const loja = lojaResponse.data;
          setClienteNome(loja?.nome_fantasia || loja?.razao_social || 'Loja');
        } catch {
          setClienteNome('Loja');
        }
      } else if (servicoData?.tipo_cliente === 'particular' && servicoData?.cliente_particular_id) {
        try {
          const clienteResponse = await api.get(`/clientes_particulares/${servicoData.cliente_particular_id}`);
          const cliente = clienteResponse.data;
          setClienteNome(cliente?.nome || 'Cliente particular');
        } catch {
          setClienteNome('Cliente particular');
        }
      } else {
        setClienteNome('N/A');
      }
    } catch (error) {
      console.error('Erro ao carregar serviço:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do serviço');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

      <ScrollView style={styles.content}>
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
                <Text style={styles.codigo}>{servico.codigo || servico.codigo_servico || servico.codigo_os_loja || servico.id?.slice?.(0, 8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(servico.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(servico.status) }]}>
                  {getStatusLabel(servico.status)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.descricao}>{servico.descricao || 'Sem descrição'}</Text>
        </View>

        {/* Informações do Cliente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <InfoRow icon="business" label="Nome" value={clienteNome} theme={theme} />
          <InfoRow icon="location" label="Endereço" value={servico.endereco || servico.endereco_execucao || 'N/A'} theme={theme} />
        </View>

        {/* Informações do Serviço */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes do Serviço</Text>
          <InfoRow icon="calendar" label="Data" value={servico.data_servico || 'N/A'} theme={theme} />
          <InfoRow icon="time" label="Horário" value={servico.horario || servico.janela_inicio || 'N/A'} theme={theme} />
          <InfoRow icon="cash" label="Valor" value={`R$ ${parseCurrency(servico.valor_total).toFixed(2)}`} theme={theme} />
        </View>

        {/* Equipe */}
        {servico.equipe_nome && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Equipe</Text>
            <InfoRow icon="people" label="Equipe" value={servico.equipe_nome} theme={theme} />
          </View>
        )}

        {/* Observações */}
        {servico.observacoes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.observacoes}>{servico.observacoes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ icon, label, value, theme }) => (
  <View style={{ 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: theme.spacing.md 
  }}>
    <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={{ marginRight: theme.spacing.sm }} />
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 16, marginTop: 2 }}>{value}</Text>
    </View>
  </View>
);

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
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    marginBottom: 0,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  codigo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  descricao: {
    fontSize: 16,
    color: theme.colors.text,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  observacoes: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
