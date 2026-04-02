import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Header, Select } from '../../components';
import { colors, spacing } from '../../theme';
import { 
  saveFactura, 
  updateFactura, 
  getFacturaById, 
  getClientes, 
  getArticulos, 
  Cliente, 
  Articulo 
} from '../../services/storageService';
import { FORMAS_PAGO } from '../../utils/constants';

type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: string };
};

export const FacturaFormScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FacturasStackParamList>>();
  const route = useRoute<RouteProp<FacturasStackParamList, 'FacturaForm'>>();
  const { facturaId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  
  const [id_cliente, setIdCliente] = useState('');
  const [id_articulo, setIdArticulo] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [impuesto, setImpuesto] = useState('0');
  const [formaPago, setFormaPago] = useState('efectivo');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [subTotal, setSubTotal] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
    if (facturaId) {
      loadFactura();
    }
  }, [facturaId]);

  useEffect(() => {
    calculateTotals();
  }, [id_articulo, cantidad, impuesto]);

  const loadData = async () => {
    try {
      const [clientesData, articulosData] = await Promise.all([
        getClientes(),
        getArticulos(),
      ]);
      setClientes(clientesData);
      setArticulos(articulosData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const loadFactura = async () => {
    try {
      const factura = await getFacturaById(facturaId!);
      if (factura) {
        setIdCliente(factura.id_cliente);
        setIdArticulo(factura.id_articulo);
        setCantidad(factura.cantidad.toString());
        setImpuesto(factura.impuesto.toString());
        setFormaPago(factura.formaPago);
        setFecha(factura.fecha);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la factura');
    }
  };

  const calculateTotals = () => {
    const articulo = articulos.find(a => a.id === id_articulo);
    const cant = parseInt(cantidad) || 0;
    const imp = parseFloat(impuesto) || 0;
    
    if (articulo) {
      const sub = articulo.precio * cant;
      setSubTotal(sub);
      setTotal(sub + imp);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!id_cliente) {
      newErrors.id_cliente = 'Seleccione un cliente';
    }
    if (!id_articulo) {
      newErrors.id_articulo = 'Seleccione un artículo';
    }
    if (!cantidad || parseInt(cantidad) <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const facturaData = {
        id_cliente,
        id_articulo,
        cantidad: parseInt(cantidad),
        sub_total: subTotal,
        impuesto: parseFloat(impuesto) || 0,
        total,
        fecha,
        formaPago,
      };

      if (facturaId) {
        await updateFactura(facturaId, facturaData);
      } else {
        await saveFactura(facturaData);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la factura');
    } finally {
      setLoading(false);
    }
  };

  const clienteOptions = clientes.map(c => ({
    label: `${c.nombre} ${c.primerApellido}`,
    value: c.id,
  }));

  const articuloOptions = articulos.map(a => ({
    label: `${a.nombre} - $${a.precio.toFixed(2)}`,
    value: a.id,
  }));

  const selectedArticulo = articulos.find(a => a.id === id_articulo);

  return (
    <View style={styles.container}>
      <Header
        title={facturaId ? 'Editar Factura' : 'Nueva Factura'}
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Select
            label="Cliente"
            placeholder="Seleccione un cliente"
            value={id_cliente}
            options={clienteOptions}
            onChange={setIdCliente}
            error={errors.id_cliente}
          />

          <Select
            label="Artículo"
            placeholder="Seleccione un artículo"
            value={id_articulo}
            options={articuloOptions}
            onChange={setIdArticulo}
            error={errors.id_articulo}
          />

          {selectedArticulo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Precio unitario: ${selectedArticulo.precio.toFixed(2)}</Text>
              <Text style={styles.infoText}>Stock disponible: {selectedArticulo.stock}</Text>
            </View>
          )}

          <Input
            label="Cantidad"
            placeholder="1"
            value={cantidad}
            onChangeText={setCantidad}
            error={errors.cantidad}
            keyboardType="number-pad"
          />

          <Input
            label="Impuesto"
            placeholder="0.00"
            value={impuesto}
            onChangeText={setImpuesto}
            keyboardType="decimal-pad"
          />

          <Select
            label="Forma de Pago"
            value={formaPago}
            options={FORMAS_PAGO}
            onChange={setFormaPago}
          />

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${subTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuesto:</Text>
              <Text style={styles.totalValue}>${parseFloat(impuesto || '0').toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalLabelFinal}>Total:</Text>
              <Text style={styles.totalValueFinal}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <Button
            title={facturaId ? 'Actualizar' : 'Crear Factura'}
            onPress={handleSave}
            loading={loading}
            style={styles.button}
          />
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
  form: {
    padding: spacing.md,
  },
  infoBox: {
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: colors.primary,
  },
  totals: {
    backgroundColor: colors.background.component,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  totalFinal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  button: {
    marginTop: spacing.lg,
  },
});
