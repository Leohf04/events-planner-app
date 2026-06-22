import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Chip, IconButton, Menu, Divider, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, Loading, Header } from '../../components';
import { colors, spacing } from '../../theme';
import { getFacturas, deleteFactura, getFacturaArticulos, FacturaRow } from '../../database/repositories/facturasRepository';
import { getClienteById } from '../../database/repositories/clientesRepository';
import { getMonedaById } from '../../database/repositories/monedasRepository';
import { getEmpresa } from '../../database/repositories/empresaRepository';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { compartirPdf } from '../../services/envioService';
import { useAlert } from '../../components/AlertDialog';

type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: number };
  FacturaDetail: { facturaId: number };
};

export const FacturasListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FacturasStackParamList>>();
  const [facturas, setFacturas] = useState<FacturaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [dataCache, setDataCache] = useState<Record<string, string>>({});
  const alert = useAlert();

  const fetchFacturas = async () => {
    try {
      const data = await getFacturas();
      setFacturas(data);

      const cache: Record<string, string> = {};
      for (const factura of data) {
        if (factura.id_cliente) {
          const cliente = await getClienteById(factura.id_cliente);
          if (cliente) cache[`c_${factura.id_cliente}`] = `${cliente.nombre} ${cliente.primerApellido}`;
        }
        if (factura.id_moneda) {
          const moneda = await getMonedaById(factura.id_moneda);
          if (moneda) cache[`m_${factura.id_moneda}`] = moneda.simbolo;
        }
      }
      setDataCache(cache);
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron cargar las facturas' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFacturas();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFacturas();
  };

  const handleDelete = (id: number) => {
    alert.showAlert({
      title: 'Confirmar',
      message: '¿Está seguro de eliminar esta factura?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFactura(id);
              await fetchFacturas();
            } catch (error) {
              alert.showAlert({ title: 'Error', message: 'No se pudo eliminar la factura' });
            }
          },
        },
      ]
    });
  };

  const buildPdfData = async (factura: FacturaRow) => {
    const moneda = factura.id_moneda ? await getMonedaById(factura.id_moneda) : null;
    const cliente = factura.id_cliente ? await getClienteById(factura.id_cliente) : null;
    const articulos = await getFacturaArticulos(factura.id);
    const empresa = await getEmpresa();
    return { factura, moneda, cliente, articulos, empresa, clienteId: factura.id_cliente };
  };

  const handleCompartir = async (factura: FacturaRow) => {
    try {
      const data = await buildPdfData(factura);
      await compartirPdf(data as any);
    } catch (error: any) {
      alert.showAlert({ title: 'Error', message: error.message });
    }
  };

  const getFormaPagoColor = (formaPago: string) => {
    switch (formaPago) {
      case 'efectivo': return { bg: 'rgba(52, 199, 89, 0.12)', text: '#34C759' };
      case 'transferencia': return { bg: 'rgba(10, 132, 255, 0.12)', text: '#0A84FF' };
      case 'zelle': return { bg: 'rgba(255, 149, 0, 0.12)', text: '#FF9500' };
      default: return { bg: 'rgba(128, 128, 128, 0.12)', text: '#808080' };
    }
  };

  const renderFactura = ({ item }: { item: FacturaRow }) => {
    const pagoStyle = getFormaPagoColor(item.formaPago);
    const monedaSimbolo = dataCache[`m_${item.id_moneda}`] || '$';

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('FacturaDetail', { facturaId: item.id })}
          style={styles.cardTouchable}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.codigo}>
                  {item.codigoFactura}
                </Text>
                <Text variant="bodySmall" style={styles.fecha}>
                  {formatDate(item.fecha)}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.infoText}>
                Cliente: {dataCache[`c_${item.id_cliente}`] || 'Desconocido'}
              </Text>
              <Text variant="titleMedium" style={styles.total}>
                Total: {formatCurrency(item.total, monedaSimbolo)}
              </Text>
              <Chip
                style={[styles.pagoChip, { backgroundColor: pagoStyle.bg }]}
                textStyle={{ color: pagoStyle.text, fontSize: 12 }}
              >
                {item.formaPago}
              </Chip>
              <View style={styles.cardActions}>
                <IconButton
                  icon="share-variant"
                  size={20}
                  onPress={() => handleCompartir(item)}
                />
              </View>
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
                leadingIcon="eye-outline"
                onPress={() => {
                  setMenuVisible(null);
                  navigation.navigate('FacturaDetail', { facturaId: item.id });
                }}
                title="Ver Detalle"
              />
              <Divider />
              <Menu.Item
                leadingIcon="pencil"
                onPress={() => {
                  setMenuVisible(null);
                  navigation.navigate('FacturaForm', { facturaId: item.id });
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
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Facturas" />
      {facturas.length === 0 ? (
        <EmptyState
          message="No hay facturas"
          icon="file-document-outline"
          actionLabel="Crear Factura"
          onAction={() => navigation.navigate('FacturaForm', {})}
        />
      ) : (
        <FlatList
          data={facturas}
          renderItem={renderFactura}
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
          onPress={() => navigation.navigate('FacturaForm', {})}
          contentStyle={{ paddingVertical: 6 }}
        >
          Crear Factura
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
  list: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  bottomButton: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  codigo: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  fecha: {
    color: colors.text.secondary,
  },
  infoText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  total: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  pagoChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    justifyContent: 'flex-end',
  },
});

export default FacturasListScreen;