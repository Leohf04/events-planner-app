import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Header, Loading, Card } from '../../components';
import { colors, spacing } from '../../theme';
import { 
  getFacturaById, 
  getClienteById, 
  getArticuloById,
  Factura,
  Cliente,
  Articulo 
} from '../../services/storageService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import api from '../../services/api';

type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: string };
  FacturaDetail: { facturaId: string };
};

export const FacturaDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FacturasStackParamList>>();
  const route = useRoute<RouteProp<FacturasStackParamList, 'FacturaDetail'>>();
  const { facturaId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [articulo, setArticulo] = useState<Articulo | null>(null);

  useEffect(() => {
    loadData();
  }, [facturaId]);

  const loadData = async () => {
    try {
      const [facturaData, clienteData, articuloData] = await Promise.all([
        getFacturaById(facturaId),
        getClienteById(facturaId),
        getArticuloById(facturaId),
      ]);
      
      setFactura(facturaData);
      if (facturaData) {
        const [clienteAux, articuloAux] = await Promise.all([
          getClienteById(facturaData.id_cliente),
          getArticuloById(facturaData.id_articulo),
        ]);
        setCliente(clienteAux);
        setArticulo(articuloAux);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!cliente?.gmail) {
      Alert.alert('Error', 'El cliente no tiene correo electrónico');
      return;
    }

    setSending(true);
    try {
      await api.post(`/facturas/${facturaId}/enviar`, {
        email: cliente.gmail,
      });
      Alert.alert('Éxito', 'Factura enviada por correo electrónico');
    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo enviar el correo';
      Alert.alert('Error', message);
    } finally {
      setSending(false);
    }
  };

  const handleEditar = () => {
    navigation.navigate('FacturaForm', { facturaId });
  };

  if (loading) {
    return <Loading />;
  }

  if (!factura) {
    return (
      <View style={styles.container}>
        <Header
          title="Factura"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Factura no encontrada</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Detalle de Factura"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.codigo}>{factura.codigoFactura}</Text>
            <Text style={styles.fecha}>{formatDate(factura.fecha)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Cliente</Text>
          {cliente ? (
            <View>
              <Text style={styles.label}>
                {cliente.nombre} {cliente.primerApellido} {cliente.segundoApellido}
              </Text>
              <Text style={styles.detail}>CI: {cliente.carnetIdentidad}</Text>
              {cliente.telefono && <Text style={styles.detail}>Tel: {cliente.telefono}</Text>}
              {cliente.gmail && <Text style={styles.detail}>Email: {cliente.gmail}</Text>}
            </View>
          ) : (
            <Text style={styles.noData}>Cliente no encontrado</Text>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Artículo</Text>
          {articulo ? (
            <View>
              <Text style={styles.label}>{articulo.nombre}</Text>
              <Text style={styles.detail}>{articulo.descripcion}</Text>
              <Text style={styles.detail}>Precio: {formatCurrency(articulo.precio)}</Text>
            </View>
          ) : (
            <Text style={styles.noData}>Artículo no encontrado</Text>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cantidad:</Text>
            <Text style={styles.detailValue}>{factura.cantidad}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal:</Text>
            <Text style={styles.detailValue}>{formatCurrency(factura.sub_total)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Impuesto:</Text>
            <Text style={styles.detailValue}>{formatCurrency(factura.impuesto)}</Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(factura.total)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Forma de Pago:</Text>
            <Text style={styles.detailValue}>{factura.formaPago}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Editar Factura"
            onPress={handleEditar}
            variant="secondary"
            style={styles.button}
          />
          
          <Button
            title="📧 Enviar por Email"
            onPress={handleEnviarEmail}
            loading={sending}
            disabled={!cliente?.gmail}
            style={styles.button}
          />
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
  header: {
    alignItems: 'center',
  },
  codigo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fecha: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  noData: {
    fontSize: 14,
    color: colors.text.disabled,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    marginTop: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
});
