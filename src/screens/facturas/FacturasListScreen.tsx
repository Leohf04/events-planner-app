import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, Loading, Header, FAB } from '../../components';
import { colors, spacing } from '../../theme';
import { getFacturas, deleteFactura, Factura, getClienteById, getArticuloById } from '../../services/storageService';
import { formatCurrency, formatDate } from '../../utils/helpers';

type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: string };
  FacturaDetail: { facturaId: string };
};

export const FacturasListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FacturasStackParamList>>();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteNames, setClienteNames] = useState<Record<string, string>>({});
  const [articuloNames, setArticuloNames] = useState<Record<string, string>>({});

  const fetchFacturas = async () => {
    try {
      const data = await getFacturas();
      setFacturas(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const cNames: Record<string, string> = {};
      const aNames: Record<string, string> = {};
      
      for (const factura of data) {
        const cliente = await getClienteById(factura.id_cliente);
        const articulo = await getArticuloById(factura.id_articulo);
        if (cliente) cNames[factura.id_cliente] = `${cliente.nombre} ${cliente.primerApellido}`;
        if (articulo) aNames[factura.id_articulo] = articulo.nombre;
      }
      
      setClienteNames(cNames);
      setArticuloNames(aNames);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFacturas();
    }, [])
  );

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar',
      '¿Está seguro de eliminar esta factura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFactura(id);
              fetchFacturas();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la factura');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Factura }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FacturaDetail', { facturaId: item.id })}
    >
      <Card>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.codigo}>{item.codigoFactura}</Text>
            <Text style={styles.cliente}>{clienteNames[item.id_cliente] || 'Cliente desconocido'}</Text>
            <Text style={styles.articulo}>{articuloNames[item.id_articulo] || 'Artículo desconocido'}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.fecha}>{formatDate(item.fecha)}</Text>
              <Text style={styles.total}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Facturas" 
        showBack 
        onBack={() => navigation.getParent()?.openDrawer()}
      />
      
      {facturas.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No hay facturas"
          message="Crea tu primera factura tocando el botón +"
        />
      ) : (
        <FlatList
          data={facturas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
      
      <FAB onPress={() => navigation.navigate('FacturaForm', {})} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.layout,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  codigo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cliente: {
    fontSize: 14,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  articulo: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  fecha: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  formaPago: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
