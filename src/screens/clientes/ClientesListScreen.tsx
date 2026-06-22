import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Searchbar, IconButton, Menu, Divider, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, Loading, Header } from '../../components';
import { colors, spacing } from '../../theme';
import { getClientes, deleteCliente, searchClientes, ClienteRow } from '../../database/repositories/clientesRepository';
import { useAlert } from '../../components/AlertDialog';

type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { clienteId?: number };
};

export const ClientesListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ClientesStackParamList>>();
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alert = useAlert();

  const fetchClientes = useCallback(async (query?: string) => {
    try {
      const data = query?.trim() ? await searchClientes(query) : await getClientes();
      setClientes(data);
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron cargar los clientes' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchClientes(searchQuery);
    }, [fetchClientes, searchQuery])
  );

  const onChangeSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setLoading(true);
    searchTimer.current = setTimeout(() => {
      fetchClientes(text);
    }, 300);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClientes();
  };

  const handleDelete = (id: number) => {
    alert.showAlert({
      title: 'Confirmar',
      message: '¿Está seguro de eliminar este cliente?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCliente(id);
              await fetchClientes();
            } catch (error) {
              alert.showAlert({ title: 'Error', message: 'No se pudo eliminar el cliente' });
            }
          },
        },
      ]
    });
  };

  const renderCliente = ({ item }: { item: ClienteRow }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ClienteForm', { clienteId: item.id })}
        style={styles.cardTouchable}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.clienteName}>
              {item.nombre} {item.primerApellido} {item.segundoApellido || ''}
            </Text>
            {item.carnetIdentidad && (
              <Text variant="bodySmall" style={styles.infoText}>
                CI: {item.carnetIdentidad}
              </Text>
            )}
            {item.gmail && (
              <Text variant="bodySmall" style={styles.infoText}>
                {item.gmail}
              </Text>
            )}
            {item.telefono && (
              <Text variant="bodySmall" style={styles.infoText}>
                {item.telefono}
              </Text>
            )}
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('ClienteForm', { clienteId: item.id });
              }}
              title="Editar"
            />
            <Divider />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => {
                setMenuVisible(null);
                handleDelete(item.id);
              }}
              title="Eliminar"
            />
          </Menu>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Clientes" />
      <Searchbar
        placeholder="Buscar clientes..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchbar}
        icon="magnify"
        clearIcon="close-circle"
      />
      {clientes.length === 0 ? (
        <EmptyState
          message="No hay clientes"
          icon="account-group-outline"
          actionLabel="Crear Cliente"
          onAction={() => navigation.navigate('ClienteForm', {})}
        />
      ) : (
        <FlatList
          data={clientes}
          renderItem={renderCliente}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <View style={styles.bottomButton}>
        <Button
          mode="contained"
          icon="plus-circle"
          onPress={() => navigation.navigate('ClienteForm', {})}
          contentStyle={{ paddingVertical: 6 }}
        >
          Crear Cliente
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.layout,
  },
  searchbar: {
    margin: spacing.md,
    backgroundColor: colors.white,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTouchable: {
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  clienteName: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  bottomButton: {
    padding: spacing.md,
    paddingTop: 0,
  },
});

export default ClientesListScreen;