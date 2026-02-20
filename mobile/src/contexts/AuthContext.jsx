import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedUser = await SecureStore.getItemAsync('userData');
      const storedToken = await SecureStore.getItemAsync('userToken');

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Conecta ao socket
        await socketService.connect();
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, senha) {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/login', {
        email,
        senha,
      });

      const { usuario, token } = response.data;

      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(usuario));

      setUser(usuario);

      // Conecta ao socket
      await socketService.connect();

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);

      // Desconecta do socket
      socketService.disconnect();

      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');

      setUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userData) {
    try {
      const updatedUser = { ...user, ...userData };
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        error,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

export default AuthContext;
