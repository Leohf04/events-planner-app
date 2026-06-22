import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Text, IconButton, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Select, Header } from '../../components';
import { colors, spacing } from '../../theme';
import { getClientes, ClienteRow } from '../../database/repositories/clientesRepository';
import { getArticulos, getArticuloById, ArticuloRow, registrarMovimientoStock } from '../../database/repositories/articulosRepository';
import { getMonedas, MonedaRow } from '../../database/repositories/monedasRepository';
import { saveFactura, getFacturaById, getFacturaArticulos } from '../../database/repositories/facturasRepository';
import { getEmpresa } from '../../database/repositories/empresaRepository';
import { formatCurrency } from '../../utils/helpers';
import { useAlert } from '../../components/AlertDialog';

type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: number };
  FacturaDetail: { facturaId: number };
};

interface LineItem {
  idArticulo: number | null;
  cantidad: number;
  precio_unitario: number;
  nombre: string;
}

export const FacturaFormScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FacturasStackParamList>>();
  const route = useRoute<RouteProp<FacturasStackParamList, 'FacturaForm'>>();
  const { facturaId } = route.params || {};
  const isEditing = !!facturaId;

  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [articulos, setArticulos] = useState<ArticuloRow[]>([]);
  const [monedas, setMonedas] = useState<MonedaRow[]>([]);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [idMoneda, setIdMoneda] = useState<number | null>(null);
  const [formaPago, setFormaPago] = useState('efectivo');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { idArticulo: null, cantidad: 1, precio_unitario: 0, nombre: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [impuestoPorc, setImpuestoPorc] = useState(10);
  const alert = useAlert();

  useEffect(() => {
    const loadInitialData = async () => {
      setClientes(await getClientes());
      setArticulos(await getArticulos());
      setMonedas(await getMonedas());
      const empresa = await getEmpresa();
      if (empresa) setImpuestoPorc(empresa.impuesto);
    };
    loadInitialData();

    if (facturaId) {
      loadFactura();
    }
  }, [facturaId]);

  const loadFactura = async () => {
    try {
      const factura = await getFacturaById(facturaId!);
      if (factura) {
        setIdCliente(factura.id_cliente);
        setIdMoneda(factura.id_moneda);
        setFormaPago(factura.formaPago);

        const items = await getFacturaArticulos(facturaId!);
        setLineItems(
          items.map((item) => ({
            idArticulo: item.idArticulo,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            nombre: item.nombre,
          }))
        );
      }
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo cargar la factura' });
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { idArticulo: null, cantidad: 1, precio_unitario: 0, nombre: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const items = [...lineItems];
    items[index] = { ...items[index], [field]: value };

    if (field === 'idArticulo' && value) {
      const articulo = articulos.find(a => a.id === value);
      if (articulo) {
        items[index].precio_unitario = articulo.precio_venta;
        items[index].nombre = articulo.nombre;
      }
    }

    setLineItems(items);
  };

  const calcularSubtotal = (): number => {
    return lineItems.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  };

  const calcularImpuesto = (): number => {
    return calcularSubtotal() * (impuestoPorc / 100);
  };

  const calcularTotal = (): number => {
    return calcularSubtotal() + calcularImpuesto();
  };

  const handleSave = async () => {
    if (!idCliente) {
      alert.showAlert({ title: 'Error', message: 'Seleccione un cliente' });
      return;
    }
    if (lineItems.length === 0 || !lineItems[0].idArticulo) {
      alert.showAlert({ title: 'Error', message: 'Agregue al menos un artículo' });
      return;
    }

    setLoading(true);
    try {
      const subTotal = calcularSubtotal();
      const impuesto = calcularImpuesto();
      const total = calcularTotal();

      for (const item of lineItems) {
        if (item.idArticulo) {
          const articulo = await getArticuloById(item.idArticulo);
          if (articulo && articulo.stock < item.cantidad) {
            alert.showAlert({ title: 'Stock insuficiente', message: `${articulo.nombre}: disponible ${articulo.stock}, requerido ${item.cantidad}` });
            setLoading(false);
            return;
          }
        }
      }

      await saveFactura(
        {
          codigoFactura: `F-${Date.now()}`,
          id_cliente: idCliente,
          fecha: new Date().toISOString(),
          subTotal,
          impuesto,
          total,
          id_moneda: idMoneda,
          formaPago,
        },
        lineItems.map((item) => ({
          idArticulo: item.idArticulo!,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        }))
      );

      for (const item of lineItems) {
        if (item.idArticulo) {
          await registrarMovimientoStock(item.idArticulo, 'salida', item.cantidad);
        }
      }

      alert.showAlert({
        title: 'Éxito',
        message: 'Factura creada correctamente',
        buttons: [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      });
    } catch (error: any) {
      alert.showAlert({ title: 'Error', message: error.message || 'No se pudo guardar la factura' });
    } finally {
      setLoading(false);
    }
  };

  const monedaOptions = monedas.map(m => ({
    label: `${m.nombre} (${m.simbolo})`,
    value: m.id,
  }));

  const clienteOptions = clientes.map(c => ({
    label: `${c.nombre} ${c.primerApellido}`,
    value: c.id,
  }));

  const articuloOptions = articulos.map(a => ({
    label: `${a.nombre} - ${formatCurrency(a.precio_venta)}`,
    value: a.id,
  }));

  const formasPago = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'transferencia' },
    { label: 'Zelle', value: 'zelle' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Editar Factura' : 'Nueva Factura'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Select
            label="Cliente"
            placeholder="Seleccionar cliente"
            value={idCliente || ''}
            options={clienteOptions}
            onChange={(value) => setIdCliente(value as number)}
          />

          <Select
            label="Moneda"
            placeholder="Seleccionar moneda"
            value={idMoneda || ''}
            options={monedaOptions}
            onChange={(value) => setIdMoneda(value as number)}
          />

          <Select
            label="Forma de Pago"
            value={formaPago}
            options={formasPago}
            onChange={(value) => setFormaPago(value as string)}
          />

          <Divider style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Artículos
            </Text>
            <IconButton icon="plus-circle-outline" onPress={addLineItem} />
          </View>

          {lineItems.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={styles.lineItemHeader}>
                <Text variant="bodySmall" style={styles.lineItemNumber}>
                  #{index + 1}
                </Text>
                {lineItems.length > 1 && (
                  <IconButton
                    icon="close-circle-outline"
                    size={20}
                    onPress={() => removeLineItem(index)}
                  />
                )}
              </View>
              <Select
                placeholder="Seleccionar artículo"
                value={item.idArticulo || ''}
                options={articuloOptions}
                onChange={(value) => updateLineItem(index, 'idArticulo', value as number)}
              />
              <View style={styles.lineItemRow}>
                <Input
                  label="Cant."
                  value={item.cantidad.toString()}
                  onChangeText={(value) => updateLineItem(index, 'cantidad', parseInt(value) || 0)}
                  keyboardType="number-pad"
                  style={styles.cantidadInput}
                />
                <Input
                  label="Precio Unit."
                  value={item.precio_unitario.toString()}
                  onChangeText={(value) => updateLineItem(index, 'precio_unitario', parseFloat(value) || 0)}
                  keyboardType="decimal-pad"
                  style={styles.precioInput}
                />
                <View style={styles.subtotalContainer}>
                  <Text variant="bodySmall" style={styles.subtotalLabel}>
                    Subtotal:
                  </Text>
                  <Text variant="bodyMedium" style={styles.subtotalValue}>
                    {formatCurrency(item.cantidad * item.precio_unitario)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <Divider style={styles.totalDivider} />

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(calcularSubtotal())}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Impuesto ({impuestoPorc}%):</Text>
              <Text style={styles.totalAmount}>{formatCurrency(calcularImpuesto())}</Text>
            </View>
            <View style={styles.totalFinalRow}>
              <Text variant="titleMedium" style={styles.totalLabel}>Total:</Text>
              <Text variant="titleMedium" style={styles.totalFinalAmount}>
                {formatCurrency(calcularTotal())}
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            icon="content-save"
            style={styles.button}
            contentStyle={{ paddingVertical: 6 }}
          >
            {isEditing ? 'Actualizar Factura' : 'Crear Factura'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.layout,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  lineItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemNumber: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cantidadInput: {
    flex: 1,
  },
  precioInput: {
    flex: 2,
  },
  subtotalContainer: {
    flex: 2,
    paddingTop: spacing.md + 4,
  },
  subtotalLabel: {
    color: colors.text.secondary,
  },
  subtotalValue: {
    fontWeight: '600',
    color: colors.primary,
  },
  totalDivider: {
    marginVertical: spacing.md,
  },
  totals: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontWeight: '500',
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
  totalFinalAmount: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  button: {
    marginTop: spacing.md,
  },
});

export default FacturaFormScreen;