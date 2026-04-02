import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, Loading, Header, Input } from '../../components';
import { colors, spacing } from '../../theme';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

export interface Cliente {
  id: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  carnetIdentidad: string;
  gmail: string;
  direccion?: string;
  telefono?: string;
}

type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { cliente?: Cliente };
  ClienteDetail: { cliente: Cliente };
};

export const ClientesListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ClientesStackParamList>>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClientes = async () => {
    try {
      const data = await api.get<Cliente[]>('/clientes');
      setClientes(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClientes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchClientes();
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Confirmar',
      '¿Está seguro de eliminar este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clientes/${id}`);
              fetchClientes();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el cliente');
            }
          },
        },
      ]
    );
  };

  const filteredClientes = clientes.filter((cliente) => {
    const query = searchQuery.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(query) ||
      cliente.primerApellido.toLowerCase().includes(query) ||
      cliente.carnetIdentidad.toLowerCase().includes(query) ||
      cliente.gmail.toLowerCase().includes(query)
    );
  });

  const renderCliente = ({ item }: { item: Cliente }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ClienteDetail', { cliente: item })}
      onLongPress={() => handleDelete(item.id)}
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.clienteName}>
            {item.nombre} {item.primerApellido} {item.segundoApellido || ''}
          </Text>
          <Text style={styles.ci}>CI: {item.carnetIdentidad}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.info}>📧 {item.gmail}</Text>
          {item.telefono && <Text style={styles.info}>📱 {item.telefono}</Text>}
          {item.direccion && <Text style={styles.info}>📍 {item.direccion}</Text>}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Cargando clientes..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Clientes"
        subtitle={`${clientes.length} registros`}
        rightAction={{
          icon: '+',
          onPress: () => navigation.navigate('ClienteForm', {}),
        }}
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredClientes.length === 0 ? (
        <EmptyState
          message={searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          actionLabel={searchQuery ? undefined : 'Agregar Cliente'}
          onAction={searchQuery ? undefined : () => navigation.navigate('ClienteForm', {})}
        />
      ) : (
        <FlatList
          data={filteredClientes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCliente}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.layout,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  clienteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ci: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cardBody: {
    gap: 4,
  },
  info: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
