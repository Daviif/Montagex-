import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

import { useTheme } from '../contexts/ThemeContext';

export default function MapaRotaScreen({ route }) {
  const { theme, isDark } = useTheme();
  const { destination, origin, title, address } = route.params || {};
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState('');

  const apiKey = Constants.expoConfig?.extra?.openRouteServiceApiKey || '';
  const defaultProfile = Constants.expoConfig?.extra?.openRouteServiceProfile || 'driving-car';
  const [profile, setProfile] = useState(defaultProfile);
  const profileOptions = [
    { id: 'driving-car', label: 'Carro' },
    { id: 'driving-hgv', label: 'Caminhão' },
    { id: 'cycling-regular', label: 'Bicicleta' },
    { id: 'foot-walking', label: 'A pé' },
  ];

  const initialRegion = useMemo(() => {
    if (origin && destination) {
      const latitude = (origin.latitude + destination.latitude) / 2;
      const longitude = (origin.longitude + destination.longitude) / 2;

      const latitudeDelta = Math.max(Math.abs(origin.latitude - destination.latitude) * 2, 0.02);
      const longitudeDelta = Math.max(Math.abs(origin.longitude - destination.longitude) * 2, 0.02);

      return { latitude, longitude, latitudeDelta, longitudeDelta };
    }

    if (destination) {
      return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    return null;
  }, [origin, destination]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!origin || !destination || !apiKey) {
        setRouteCoords([]);
        setRouteInfo(null);
        setRouteError(apiKey ? '' : 'Chave do OpenRouteService nao configurada.');
        return;
      }

      try {
        setRouteError('');
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiKey,
          },
          body: JSON.stringify({
            coordinates: [
              [origin.longitude, origin.latitude],
              [destination.longitude, destination.latitude],
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const geometry = data?.features?.[0]?.geometry?.coordinates || [];
        const summary = data?.features?.[0]?.properties?.summary || null;

        setRouteCoords(
          geometry.map((point) => ({
            latitude: point[1],
            longitude: point[0],
          }))
        );

        if (summary) {
          setRouteInfo({
            distanceKm: summary.distance / 1000,
            durationMin: summary.duration / 60,
          });
        } else {
          setRouteInfo(null);
        }
      } catch (error) {
        console.error('Erro ao carregar rota:', error);
        setRouteError('Nao foi possivel carregar a rota.');
        setRouteCoords([]);
        setRouteInfo(null);
      }
    };

    fetchRoute();
  }, [origin, destination, apiKey, profile]);

  const styles = createStyles(theme);

  if (!destination || !initialRegion) {
    return (
      <View style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={styles.emptyText}>Coordenadas nao informadas para esta rota.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <MapView style={styles.map} initialRegion={initialRegion}>
        {origin && (
          <Marker coordinate={origin} title="Sua localizacao" pinColor={theme.colors.info} />
        )}
        <Marker
          coordinate={destination}
          title={title || 'Destino'}
          description={address || ''}
          pinColor={theme.colors.primary}
        />
        {origin && routeCoords.length === 0 && (
          <Polyline
            coordinates={[origin, destination]}
            strokeColor={theme.colors.info}
            strokeWidth={3}
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={theme.colors.info}
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>Modo de rota</Text>
        <View style={styles.profileRow}>
          {profileOptions.map((option) => (
            <Text
              key={option.id}
              style={[
                styles.profileChip,
                profile === option.id && styles.profileChipActive,
              ]}
              onPress={() => setProfile(option.id)}
            >
              {option.label}
            </Text>
          ))}
        </View>
      </View>

      {!!routeError && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{routeError}</Text>
        </View>
      )}

      {routeInfo && (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Distancia: {routeInfo.distanceKm.toFixed(2)} km
          </Text>
          <Text style={styles.infoText}>
            Duracao: {routeInfo.durationMin.toFixed(0)} min
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  notice: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  noticeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
  profileCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  profileChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  profileChipActive: {
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
