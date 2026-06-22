import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Text, Button, Divider, Chip } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Header, Loading } from '../../components';
import { colors, spacing } from '../../theme';
import { getFacturaById, getFacturaArticulos, FacturaRow } from '../../database/repositories/facturasRepository';
import { getClienteById, ClienteRow } from '../../database/repositories/clientesRepository';
import { getMonedaById, MonedaRow } from '../../database/repositories/monedasRepository';
import { getEmpresa } from '../../database/repositories/empresaRepository';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { guardarPdf, compartirPdf } from '../../services/envioService';
import { useAlert } from '../../components/AlertDialog';

type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: number };
  FacturaDetail: { facturaId: number };
};

export const FacturaDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FacturasStackParamList>>();
  const route = useRoute<RouteProp<FacturasStackParamList, 'FacturaDetail'>>();
  const { facturaId } = route.params;

  const [factura, setFactura] = useState<FacturaRow | null>(null);
  const [cliente, setCliente] = useState<ClienteRow | null>(null);
  const [moneda, setMoneda] = useState<MonedaRow | null>(null);
  const [articulos, setArticulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const alert = useAlert();

  useEffect(() => {
    loadData();
  }, [facturaId]);

  const loadData = async () => {
    try {
      const f = await getFacturaById(facturaId);
      if (!f) return;

      setFactura(f);
      setCliente(f.id_cliente ? await getClienteById(f.id_cliente) : null);
      setMoneda(f.id_moneda ? await getMonedaById(f.id_moneda) : null);
      setArticulos(await getFacturaArticulos(facturaId));
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo cargar la factura' });
    } finally {
      setLoading(false);
    }
  };

  const buildPdfData = async () => {
    if (!factura) return null;
    return {
      factura,
      cliente,
      empresa: await getEmpresa(),
      moneda,
      clienteId: factura.id_cliente,
      articulos,
    };
  };

  const handleGuardarPdf = async () => {
    const data = await buildPdfData();
    if (!data) return;
    setLoadingPdf(true);
    try {
      const uri = await guardarPdf(data as any);
      alert.showAlert({ title: 'Éxito', message: `PDF guardado correctamente\n\n${uri}` });
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo guardar el PDF' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleVistaPrevia = async () => {
    const data = await buildPdfData();
    if (!data) return;
    setLoadingPreview(true);
    try {
      const uri = await guardarPdf(data as any);
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: 'application/pdf',
          flags: 268435457,
        });
      } else {
        await Linking.openURL(uri);
      }
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo abrir la vista previa' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCompartir = async () => {
    const data = await buildPdfData();
    if (!data) return;
    setLoadingShare(true);
    try {
      await compartirPdf(data as any);
    } catch (error: any) {
      alert.showAlert({ title: 'Error', message: error.message });
    } finally {
      setLoadingShare(false);
    }
  };

  if (loading || !factura) {
    return <Loading />;
  }

  const simbolo = moneda?.simbolo || '$';

  return (
    <View style={styles.container}>
      <Header
        title={`Factura ${factura.codigoFactura}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text variant="headlineSmall" style={styles.codigo}>{factura.codigoFactura}</Text>
          <Text variant="bodyMedium" style={styles.fecha}>{formatDateTime(factura.fecha)}</Text>
          <Chip
            icon={factura.formaPago === 'efectivo' ? 'cash' : factura.formaPago === 'zelle' ? 'bank-transfer' : 'bank'}
            style={styles.pagoChip}
          >
            {factura.formaPago}
          </Chip>
        </View>

        {cliente && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Cliente
            </Text>
            <Text variant="bodyMedium">
              {cliente.nombre} {cliente.primerApellido} {cliente.segundoApellido || ''}
            </Text>
            {cliente.carnetIdentidad && (
              <Text variant="bodySmall" style={styles.infoText}>
                CI: {cliente.carnetIdentidad}
              </Text>
            )}
            {cliente.gmail && (
              <Text variant="bodySmall" style={styles.infoText}>
                {cliente.gmail}
              </Text>
            )}
            {cliente.telefono && (
              <Text variant="bodySmall" style={styles.infoText}>
                {cliente.telefono}
              </Text>
            )}
          </View>
        )}

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Artículos
        </Text>
        {articulos.map((art, index) => (
          <View key={art.id} style={styles.articuloRow}>
            <View style={styles.articuloInfo}>
              <Text variant="bodyMedium" style={styles.articuloName}>
                {art.nombre}
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                {art.cantidad} x {formatCurrency(art.precio_unitario, simbolo)}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.articuloSubtotal}>
              {formatCurrency(art.cantidad * art.precio_unitario, simbolo)}
            </Text>
          </View>
        ))}

        <Divider style={styles.divider} />

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(factura.subTotal, simbolo)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Impuesto:</Text>
            <Text>{formatCurrency(factura.impuesto, simbolo)}</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text variant="titleMedium" style={styles.totalLabel}>Total:</Text>
            <Text variant="titleMedium" style={styles.totalAmount}>
              {formatCurrency(factura.total, simbolo)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Acciones
        </Text>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="download"
            onPress={handleGuardarPdf}
            loading={loadingPdf}
            style={styles.actionButton}
          >
            Guardar PDF
          </Button>
          <Button
            mode="outlined"
            icon="file-eye-outline"
            onPress={handleVistaPrevia}
            loading={loadingPreview}
            style={styles.actionButton}
          >
            Vista Previa
          </Button>
          <Button
            mode="outlined"
            icon="share-variant"
            onPress={handleCompartir}
            loading={loadingShare}
            style={styles.actionButton}
          >
            Compartir
          </Button>
        </View>
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
  },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  codigo: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  fecha: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  pagoChip: {
    marginTop: spacing.sm,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    marginVertical: spacing.md,
  },
  articuloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  articuloInfo: {
    flex: 1,
  },
  articuloName: {
    fontWeight: '500',
    color: colors.text.primary,
  },
  articuloSubtotal: {
    fontWeight: '600',
    color: colors.primary,
  },
  totals: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
});

export default FacturaDetailScreen;