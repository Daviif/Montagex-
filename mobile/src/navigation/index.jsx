import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ServicosScreen from '../screens/ServicosScreen';
import ServicoDetalhesScreen from '../screens/ServicoDetalhesScreen';
import NovoServicoScreen from '../screens/NovoServicoScreen';
import EquipesScreen from '../screens/EquipesScreen';
import FinanceiroScreen from '../screens/FinanceiroScreen';
import PerfilScreen from '../screens/PerfilScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Servicos') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Equipes') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Financeiro') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Servicos" component={ServicosScreen} options={{ title: 'Serviços' }} />
      <Tab.Screen name="Equipes" component={EquipesScreen} options={{ title: 'Equipes' }} />
      <Tab.Screen name="Financeiro" component={FinanceiroScreen} options={{ title: 'Financeiro' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ServicoDetalhes" 
        component={ServicoDetalhesScreen}
        options={{ title: 'Detalhes do Serviço' }}
      />
      <Stack.Screen 
        name="NovoServico" 
        component={NovoServicoScreen}
        options={{ title: 'Novo Serviço' }}
      />
      <Stack.Screen 
        name="Configuracoes" 
        component={ConfiguracoesScreen}
        options={{ title: 'Configurações' }}
      />
    </Stack.Navigator>
  );
}

export default function Routes() {
  const { signed, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return null; // TODO: Adicionar splash screen
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.colors.background === '#111827',
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
      }}
    >
      {signed ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
