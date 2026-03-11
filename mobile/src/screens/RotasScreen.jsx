import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function RotasScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [rotas, setRotas] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [rotaServicos, setRotaServicos] = useState([]);
  const [equipes, setEquipes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingServicoId, setUpdatingServicoId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const canUpdateServico = user?.tipo === 'admin' || user?.tipo === 'montador';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [rotasResponse, rotaServicosResponse, servicosResponse, equipesResponse] = await Promise.all([
        api.get('/rotas'),
        api.get('/rota_servicos'),
        api.get('/servicos'),
        api.get('/equipes'),
      ]);

      setRotas(Array.isArray(rotasResponse.data) ? rotasResponse.data : []);
      setRotaServicos(Array.isArray(rotaServicosResponse.data) ? rotaServicosResponse.data : []);
      setServicos(Array.isArray(servicosResponse.data) ? servicosResponse.data : []);
      setEquipes(Array.isArray(equipesResponse.data) ? equipesResponse.data : []);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
      setRotas([]);
      setRotaServicos([]);
      setServicos([]);
      setEquipes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const requestLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      setLocationError('');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('Permissao de localizacao negada.');
        setCurrentLocation(null);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error('Erro ao obter localizacao:', error);
      setLocationError('Nao foi possivel obter a localizacao.');
      setCurrentLocation(null);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      requestLocation();
    }, [requestLocation])
  );

  const equipesMap = useMemo(
    () => new Map(equipes.map((equipe) => [equipe.id, equipe.nome || 'Equipe'])),
    [equipes]
  );

  const servicosMap = useMemo(() => {
    const map = new Map();

    servicos.forEach((servico) => {
      map.set(servico.id, {
        id: servico.id,
        codigo: servico.codigo_servico || servico.codigo_os_loja || servico.id?.slice?.(0, 8),
        cliente: servico.cliente_final_nome || 'Cliente',
        endereco: servico.endereco_execucao || 'Endereço não informado',
        status: servico.status || 'agendado',
        latitude: servico.latitude != null ? Number(servico.latitude) : null,
        longitude: servico.longitude != null ? Number(servico.longitude) : null,
      });
    });

    return map;
  }, [servicos]);

  const rotasComServicos = useMemo(() => {
    const servicosPorRota = new Map();

    rotaServicos.forEach((relacao) => {
      const rotaId = relacao.rota_id;
      if (!servicosPorRota.has(rotaId)) {
        servicosPorRota.set(rotaId, []);
      }

      const servicoInfo = servicosMap.get(relacao.servico_id);
      if (servicoInfo) {
        servicosPorRota.get(rotaId).push({
          ...servicoInfo,
          ordem: relacao.ordem_visita ?? null,
        });
      }
    });

    return rotas
      .map((rota) => ({
        ...rota,
        equipe_nome: rota.equipe_id ? (equipesMap.get(rota.equipe_id) || 'Equipe') : 'Sem equipe',
        servicos: (servicosPorRota.get(rota.id) || []).sort((a, b) => {
          if (a.ordem == null && b.ordem == null) return 0;
          if (a.ordem == null) return 1;
          if (b.ordem == null) return -1;
          return a.ordem - b.ordem;
        }),
      }))
      .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  }, [rotas, rotaServicos, servicosMap, equipesMap]);

  const filteredRotas = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return rotasComServicos;

    return rotasComServicos.filter((rota) => {
      const byRota =
        String(rota?.id || '').toLowerCase().includes(searchTerm) ||
        String(rota?.status || '').toLowerCase().includes(searchTerm) ||
        String(rota?.equipe_nome || '').toLowerCase().includes(searchTerm) ||
        String(rota?.data || '').toLowerCase().includes(searchTerm);

      const byServico = rota.servicos.some((servico) =>
        String(servico?.codigo || '').toLowerCase().includes(searchTerm) ||
        String(servico?.cliente || '').toLowerCase().includes(searchTerm) ||
        String(servico?.endereco || '').toLowerCase().includes(searchTerm)
      );

      return byRota || byServico;
    });
  }, [rotasComServicos, search]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'concluida':
      case 'concluido':
        return theme.colors.success;
      case 'em_andamento':
      case 'em_rota':
        return theme.colors.info;
      case 'cancelada':
      case 'cancelado':
        return theme.colors.danger;
      default:
        return theme.colors.warning;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'em_rota':
      case 'em_andamento':
        return 'Em andamento';
      case 'agendado':
        return 'Agendado';
      default:
        return status || 'Sem status';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Sem data';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'Sem data';
    return parsed.toLocaleDateString('pt-BR');
  };

  const haversineDistanceKm = (from, to) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const nextRouteSuggestion = useMemo(() => {
    if (!currentLocation) return null;

    const candidates = [];

    rotasComServicos.forEach((rota) => {
      rota.servicos.forEach((servico) => {
        if (servico.latitude == null || servico.longitude == null) return;
        if (servico.status === 'concluido' || servico.status === 'cancelado') return;

        const distanceKm = haversineDistanceKm(currentLocation, {
          latitude: servico.latitude,
          longitude: servico.longitude,
        });

        candidates.push({
          rota,
          servico,
          distanceKm,
        });
      });
    });

    if (!candidates.length) return null;

    candidates.sort((a, b) => a.distanceKm - b.distanceKm);
    return candidates[0];
  }, [currentLocation, rotasComServicos]);

  const openInMaps = (servico) => {
    if (!servico?.latitude || !servico?.longitude) return;

    navigation.navigate('MapaRota', {
      destination: {
        latitude: servico.latitude,
        longitude: servico.longitude,
      },
      origin: currentLocation,
      title: servico.codigo,
      address: servico.endereco,
    });
  };

  const updateServicoStatus = async (servicoId, status) => {
    if (!canUpdateServico || !servicoId) return;

    const statusLabel = status === 'concluido' ? 'concluído' : 'cancelado';

    Alert.alert(
      'Confirmar atualização',
      `Deseja marcar este serviço como ${statusLabel}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            try {
              setUpdatingServicoId(servicoId);
              await api.put(`/servicos/${servicoId}`, { status });
              await loadData();
            } catch (error) {
              console.error('Erro ao atualizar status do serviço:', error);
              Alert.alert('Erro', 'Não foi possível atualizar o status do serviço.');
            } finally {
              setUpdatingServicoId(null);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  const renderRotaCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerMain}>
            <Text style={styles.rotaTitle}>Rota • {formatDate(item.data)}</Text>
            <Text style={styles.rotaSubtitle}>{item.equipe_nome}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status || 'planejada'}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="map-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.metaText}>{item.servicos.length} serviço(s)</Text>
        </View>

        {item.servicos.length > 0 ? (
          <View style={styles.servicosList}>
            {item.servicos.map((servico) => (
              <View key={`${item.id}-${servico.id}`} style={styles.servicoItem}>
                <View style={styles.servicoHeader}>
                  <Text style={styles.servicoCodigo}>{servico.codigo}</Text>
                  {!!servico.ordem && <Text style={styles.servicoOrdem}>#{servico.ordem}</Text>}
                </View>
                <Text style={styles.servicoCliente} numberOfLines={1}>{servico.cliente}</Text>
                <Text style={styles.servicoEndereco} numberOfLines={1}>{servico.endereco}</Text>

                <View style={styles.servicoFooter}>
                  <View style={[styles.servicoStatusBadge, { backgroundColor: `${getStatusColor(servico.status)}22` }]}>
                    <Text style={[styles.servicoStatusText, { color: getStatusColor(servico.status) }]}>
                      {getStatusLabel(servico.status)}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    {!!servico.latitude && !!servico.longitude && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonInfo]}
                        onPress={() => openInMaps(servico)}
                      >
                        <Ionicons name="map-outline" size={14} color="#fff" />
                      </TouchableOpacity>
                    )}

                    {canUpdateServico && servico.status !== 'concluido' && servico.status !== 'cancelado' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonSuccess]}
                          onPress={() => updateServicoStatus(servico.id, 'concluido')}
                          disabled={updatingServicoId === servico.id}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonDanger]}
                          onPress={() => updateServicoStatus(servico.id, 'cancelado')}
                          disabled={updatingServicoId === servico.id}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyServicos}>Nenhum serviço vinculado.</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={styles.title}>Rotas</Text>
        <Text style={styles.subtitle}>Acompanhamento das rotas e serviços</Text>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Ionicons name="navigate-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.locationTitle}>Localizacao atual</Text>
        </View>
        {isLocating ? (
          <Text style={styles.locationText}>Obtendo localizacao...</Text>
        ) : currentLocation ? (
          <Text style={styles.locationText}>
            Latitude {currentLocation.latitude.toFixed(4)} • Longitude {currentLocation.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.locationText}>{locationError || 'Localizacao nao disponivel.'}</Text>
        )}
        <TouchableOpacity style={styles.locationButton} onPress={requestLocation}>
          <Text style={styles.locationButtonText}>Atualizar localizacao</Text>
        </TouchableOpacity>
      </View>

      {nextRouteSuggestion && (
        <View style={styles.nextRouteCard}>
          <View style={styles.nextRouteHeader}>
            <Ionicons name="compass-outline" size={18} color={theme.colors.info} />
            <Text style={styles.nextRouteTitle}>Proxima rota sugerida</Text>
          </View>
          <Text style={styles.nextRouteMeta}>
            {nextRouteSuggestion.rota.equipe_nome} • {formatDate(nextRouteSuggestion.rota.data)}
          </Text>
          <Text style={styles.nextRouteServico}>
            {nextRouteSuggestion.servico.codigo} — {nextRouteSuggestion.servico.cliente}
          </Text>
          <Text style={styles.nextRouteEndereco} numberOfLines={2}>
            {nextRouteSuggestion.servico.endereco}
          </Text>
          <Text style={styles.nextRouteDistance}>
            Distancia aproximada: {nextRouteSuggestion.distanceKm.toFixed(2)} km
          </Text>
          <TouchableOpacity
            style={styles.nextRouteButton}
            onPress={() => openInMaps(nextRouteSuggestion.servico)}
          >
            <Text style={styles.nextRouteButtonText}>Abrir mapa no app</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por data, equipe, código ou cliente"
          placeholderTextColor={theme.colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredRotas}
        keyExtractor={(item) => item.id}
        renderItem={renderRotaCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={44} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma rota encontrada</Text>
          </View>
        }
      />
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  locationCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  locationButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  nextRouteCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  nextRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.xs,
  },
  nextRouteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  nextRouteMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nextRouteServico: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  nextRouteEndereco: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  nextRouteDistance: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.info,
    fontWeight: '600',
  },
  nextRouteButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.info,
  },
  nextRouteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    height: 44,
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerMain: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  rotaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rotaSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  badge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  servicosList: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  servicoItem: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  servicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  servicoCodigo: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  servicoOrdem: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  servicoCliente: {
    fontSize: 12,
    color: theme.colors.text,
  },
  servicoEndereco: {
    marginTop: 2,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  servicoFooter: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicoStatusBadge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  servicoStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonSuccess: {
    backgroundColor: theme.colors.success,
  },
  actionButtonDanger: {
    backgroundColor: theme.colors.danger,
  },
  actionButtonInfo: {
    backgroundColor: theme.colors.info,
  },
  emptyServicos: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
});
