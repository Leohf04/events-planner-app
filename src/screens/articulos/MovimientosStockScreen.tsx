import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header, Loading, EmptyState } from '../../components';
import { colors, spacing } from '../../theme';
import { getMovimientosStock, MovimientoStockRow } from '../../database/repositories/articulosRepository';

type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: number };
  MovimientosStock: { articuloId: number; articuloNombre: string };
};

export const MovimientosStockScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ArticulosStackParamList>>();
  const route = useRoute<RouteProp<ArticulosStackParamList, 'MovimientosStock'>>();
  const { articuloId, articuloNombre } = route.params;

  const [movimientos, setMovimientos] = useState<MovimientoStockRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovimientos();
  }, [articuloId]);

  const loadMovimientos = async () => {
    try {
      const data = await getMovimientosStock(articuloId);
      setMovimientos(data);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title={`Historial: ${articuloNombre}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {movimientos.length === 0 ? (
        <EmptyState
          message="No hay movimientos registrados"
          icon="history"
        />
      ) : (
        <FlatList
          data={movimientos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.movimientoCard}>
              <View style={styles.movimientoHeader}>
                <Chip
                  style={[
                    styles.tipoChip,
                    { backgroundColor: item.tipo === 'entrada' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(176, 0, 32, 0.12)' }
                  ]}
                  textStyle={{
                    color: item.tipo === 'entrada' ? '#34C759' : '#B00020',
                    fontSize: 12,
                  }}
                >
                  {item.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                </Chip>
                <Text variant="bodySmall" style={styles.fecha}>
                  {new Date(item.fecha).toLocaleString()}
                </Text>
              </View>
              <View style={styles.movimientoBody}>
                <Text variant="bodyMedium" style={styles.cantidad}>
                  {item.tipo === 'entrada' ? '+' : '-'}{item.cantidad}
                </Text>
                {item.motivo && (
                  <Text variant="bodySmall" style={styles.motivo}>
                    {item.motivo}
                  </Text>
                )}
              </View>
            </View>
          )}
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
  list: {
    padding: spacing.md,
  },
  movimientoCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  movimientoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipoChip: {
    height: 28,
  },
  fecha: {
    color: colors.text.secondary,
  },
  movimientoBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cantidad: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  motivo: {
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
});

export default MovimientosStockScreen;
