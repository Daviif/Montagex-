# 🛠️ Guia de Desenvolvimento - Montagex Mobile

## Arquitetura

### Navegação

O app usa **React Navigation** com duas stacks principais:

1. **AuthNavigator** - Telas de autenticação (Login)
2. **AppNavigator** - Telas principal do app

Dentro do AppNavigator, temos:
- **TabNavigator** - Navegação por abas (Home, Serviços, Equipes, Financeiro, Perfil)
- **Stack Screens** - Telas que abrem por cima das tabs (Detalhes, Novo Serviço, etc.)

### Contextos

#### AuthContext
Gerencia autenticação:
```javascript
const { user, signed, loading, signIn, signOut } = useAuth();
```

- `user` - Dados do usuário logado
- `signed` - Boolean se está autenticado
- `loading` - Boolean se está carregando
- `signIn(email, senha)` - Função de login
- `signOut()` - Função de logout

#### ThemeContext
Gerencia tema claro/escuro:
```javascript
const { theme, isDark, themeMode, toggleTheme } = useTheme();
```

- `theme` - Objeto com cores e espaçamentos
- `isDark` - Boolean se está no modo escuro
- `themeMode` - 'light' | 'dark' | 'auto'
- `toggleTheme(mode)` - Alterna o tema

### Serviços

#### API (api.js)
Cliente HTTP baseado em Axios:
```javascript
import api from '../services/api';

// GET
const response = await api.get('/servicos');

// POST
const response = await api.post('/servicos', data);

// PUT
const response = await api.put('/servicos/1', data);

// DELETE
const response = await api.delete('/servicos/1');
```

O token é adicionado automaticamente nos headers.

#### Socket (socket.js)
Cliente WebSocket baseado em Socket.IO:
```javascript
import socketService from '../services/socket';

// Conectar
await socketService.connect();

// Escutar eventos
socketService.on('servico:atualizado', (data) => {
  console.log('Serviço atualizado:', data);
});

// Emitir eventos
socketService.emit('servico:acompanhar', { id: 123 });

// Desconectar
socketService.disconnect();
```

## Criando Novas Telas

### 1. Criar o arquivo da tela

```javascript
// src/screens/MinhaNovaScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

export default function MinhaNovaScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Minha Nova Tela</Text>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
  },
});
```

### 2. Adicionar à navegação

```javascript
// src/navigation/index.jsx
import MinhaNovaScreen from '../screens/MinhaNovaScreen';

// No Stack.Navigator apropriado:
<Stack.Screen 
  name="MinhaNova" 
  component={MinhaNovaScreen}
  options={{ title: 'Minha Nova Tela' }}
/>
```

### 3. Navegar para a tela

```javascript
// De outra tela:
navigation.navigate('MinhaNova');

// Com parâmetros:
navigation.navigate('MinhaNova', { id: 123 });
```

## Criando Componentes

### Estrutura básica:

```javascript
// src/components/MeuComponente.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function MeuComponente({ title, onPress, icon }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {icon && <Ionicons name={icon} size={24} color={theme.colors.primary} />}
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
});
```

### Usar o componente:

```javascript
import MeuComponente from '../components/MeuComponente';

<MeuComponente 
  title="Clique aqui"
  icon="star"
  onPress={() => console.log('Clicado!')}
/>
```

## Tema e Estilos

### Cores disponíveis:

```javascript
theme.colors.primary        // Azul principal
theme.colors.secondary      // Roxo secundário
theme.colors.success        // Verde
theme.colors.warning        // Amarelo
theme.colors.danger         // Vermelho
theme.colors.info           // Ciano
theme.colors.background     // Fundo principal
theme.colors.surface        // Cards, containers
theme.colors.text           // Texto principal
theme.colors.textSecondary  // Texto secundário
theme.colors.border         // Bordas
theme.colors.placeholder    // Placeholders
```

### Espaçamentos:

```javascript
theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 16
theme.spacing.lg   // 24
theme.spacing.xl   // 32
```

### Border Radius:

```javascript
theme.borderRadius.sm    // 4
theme.borderRadius.md    // 8
theme.borderRadius.lg    // 12
theme.borderRadius.xl    // 16
theme.borderRadius.full  // 9999
```

### Sombras:

```javascript
theme.shadows.sm
theme.shadows.md
theme.shadows.lg
```

## Ícones

Usamos **Ionicons** do Expo:

```javascript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color={theme.colors.primary} />
```

Ver todos os ícones: https://ionic.io/ionicons

## Formulários

### Input básico:

```javascript
const [value, setValue] = useState('');

<TextInput
  style={styles.input}
  placeholder="Digite algo"
  placeholderTextColor={theme.colors.placeholder}
  value={value}
  onChangeText={setValue}
/>
```

### Input de senha:

```javascript
const [senha, setSenha] = useState('');
const [showPassword, setShowPassword] = useState(false);

<View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder="Senha"
    value={senha}
    onChangeText={setSenha}
    secureTextEntry={!showPassword}
  />
  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    <Ionicons 
      name={showPassword ? 'eye' : 'eye-off'} 
      size={20} 
    />
  </TouchableOpacity>
</View>
```

## Listas

### FlatList básica:

```javascript
<FlatList
  data={items}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <ItemCard item={item} />
  )}
  refreshing={refreshing}
  onRefresh={onRefresh}
  ListEmptyComponent={
    <Text>Nenhum item encontrado</Text>
  }
/>
```

## Estado de Loading

```javascript
const [loading, setLoading] = useState(false);

{loading ? (
  <ActivityIndicator size="large" color={theme.colors.primary} />
) : (
  <Content />
)}
```

## Tratamento de Erros

```javascript
try {
  const response = await api.post('/endpoint', data);
  Alert.alert('Sucesso', 'Operação realizada!');
} catch (error) {
  const message = error.response?.data?.error || 'Erro desconhecido';
  Alert.alert('Erro', message);
}
```

## Pull to Refresh

```javascript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary}
    />
  }
>
  {/* Conteúdo */}
</ScrollView>
```

## Navegação

### Navegar para outra tela:

```javascript
navigation.navigate('NomeDaTela');
```

### Com parâmetros:

```javascript
navigation.navigate('DetalhesServico', { id: 123 });
```

### Receber parâmetros:

```javascript
const { id } = route.params;
```

### Voltar:

```javascript
navigation.goBack();
```

### Resetar navegação:

```javascript
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});
```

## WebSocket em Tempo Real

### Conectar e escutar:

```javascript
useEffect(() => {
  // Conectar
  socketService.connect();

  // Escutar evento
  const handleUpdate = (data) => {
    console.log('Atualização:', data);
    // Atualizar estado
  };

  socketService.on('evento:nome', handleUpdate);

  // Cleanup
  return () => {
    socketService.off('evento:nome', handleUpdate);
  };
}, []);
```

### Emitir evento:

```javascript
socketService.emit('evento:nome', { dados: 'valor' });
```

## Boas Práticas

1. **Sempre use o tema** para cores e espaçamentos
2. **Crie componentes reutilizáveis** para elementos repetidos
3. **Use hooks customizados** para lógica complexa
4. **Trate erros** adequadamente
5. **Loading states** para melhor UX
6. **Empty states** quando não há dados
7. **Pull to refresh** em listas
8. **Otimize imagens** antes de usar
9. **Use memo/useMemo** para otimização se necessário
10. **Teste em diferentes tamanhos** de tela

## Debugging

### Ver logs:

```javascript
console.log('Valor:', valor);
console.error('Erro:', error);
```

### React Native Debugger:

1. Pressione `j` no terminal Expo
2. Ou shake o dispositivo e selecione "Debug"

### Network Inspector:

1. Shake o dispositivo
2. Selecione "Debug Remote JS"
3. Abra Chrome DevTools > Network

## Próximos Passos

- [ ] Implementar tela de Novo Serviço (formulário completo)
- [ ] Implementar tela de Equipes
- [ ] Implementar tela de Financeiro
- [ ] Adicionar upload de imagens/anexos
- [ ] Implementar notificações push
- [ ] Adicionar câmera para fotos
- [ ] Implementar modo offline
- [ ] Adicionar geolocalização
- [ ] Criar testes unitários
- [ ] Otimizar performance

## Recursos Úteis

- **React Native Docs:** https://reactnative.dev/
- **Expo Docs:** https://docs.expo.dev/
- **React Navigation:** https://reactnavigation.org/
- **Ionicons:** https://ionic.io/ionicons
- **React Native Paper:** https://callstack.github.io/react-native-paper/

---

Desenvolvido com ❤️ para o Montagex
