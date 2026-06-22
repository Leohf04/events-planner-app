import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Loading, Header } from '../../components';
import { colors, spacing } from '../../theme';
import { getFacturas } from '../../database/repositories/facturasRepository';
import { getClientes } from '../../database/repositories/clientesRepository';
import { getArticulos } from '../../database/repositories/articulosRepository';
import { getMonedaById } from '../../database/repositories/monedasRepository';
import { formatCurrency } from '../../utils/helpers';

interface DashboardData {
  totalFacturas: number;
  totalIngresos: number;
  totalClientes: number;
  totalArticulos: number;
  facturasRecientes: any[];
  monedaSimbolo: string;
}

export const DashboardScreen: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const facturas = await getFacturas();
      const clientes = await getClientes();
      const articulos = await getArticulos();

      let totalIngresos = 0;
      for (const f of facturas) {
        totalIngresos += f.total || 0;
      }

      const monedaSimbolo = facturas[0]?.id_moneda
        ? (await getMonedaById(facturas[0].id_moneda))?.simbolo || '$'
        : '$';

      const recientes = facturas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);

      setData({
        totalFacturas: facturas.length,
        totalIngresos,
        totalClientes: clientes.length,
        totalArticulos: articulos.length,
        facturasRecientes: recientes,
        monedaSimbolo,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header title="Dashboard" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.primary} />
                <Text variant="headlineMedium" style={styles.statValue}>{data?.totalFacturas}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Facturas</Text>
              </View>
            </Card>
          </View>
          <View style={styles.gridItem}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialCommunityIcons name="currency-usd" size={28} color={colors.success} />
                <Text variant="headlineMedium" style={styles.statValue}>
                  {formatCurrency(data?.totalIngresos || 0, data?.monedaSimbolo)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Ingresos</Text>
              </View>
            </Card>
          </View>
          <View style={styles.gridItem}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialCommunityIcons name="account-group-outline" size={28} color={colors.warning} />
                <Text variant="headlineMedium" style={styles.statValue}>{data?.totalClientes}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Clientes</Text>
              </View>
            </Card>
          </View>
          <View style={styles.gridItem}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialCommunityIcons name="package-variant-closed" size={28} color={colors.error} />
                <Text variant="headlineMedium" style={styles.statValue}>{data?.totalArticulos}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Artículos</Text>
              </View>
            </Card>
          </View>
        </View>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Facturas Recientes
        </Text>

        {data?.facturasRecientes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No hay facturas registradas
            </Text>
          </Card>
        ) : (
          data?.facturasRecientes.map((factura) => (
            <Card key={factura.id} style={styles.recentCard}>
              <View style={styles.recentRow}>
                <View style={styles.recentInfo}>
                  <Text variant="bodyMedium" style={styles.recentCodigo}>
                    {factura.codigoFactura}
                  </Text>
                  <Text variant="bodySmall" style={styles.recentFecha}>
                    {new Date(factura.fecha).toLocaleDateString()}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.recentTotal}>
                  {formatCurrency(factura.total, data?.monedaSimbolo)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.layout,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
  },
  statCard: {
    minWidth: '100%',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emptyCard: {
    padding: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  recentCard: {
    marginBottom: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentCodigo: {
    fontWeight: '600',
    color: colors.primary,
  },
  recentFecha: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  recentTotal: {
    fontWeight: '700',
    color: colors.text.primary,
  },
});

export default DashboardScreen;
