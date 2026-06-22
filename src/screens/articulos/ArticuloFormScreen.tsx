import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Select, Header } from '../../components';
import { useAlert } from '../../components/AlertDialog';
import { colors, spacing } from '../../theme';
import { saveArticulo, updateArticulo, getArticuloById } from '../../database/repositories/articulosRepository';
import { getMonedas, MonedaRow } from '../../database/repositories/monedasRepository';

type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: number };
};

interface FormData {
  nombre: string;
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  id_moneda_compra: number | null;
  id_moneda_venta: number | null;
  stock: string;
}

export const ArticuloFormScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ArticulosStackParamList>>();
  const route = useRoute<RouteProp<ArticulosStackParamList, 'ArticuloForm'>>();
  const { articuloId } = route.params || {};
  const isEditing = !!articuloId;
  const alert = useAlert();

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    precio_compra: '',
    precio_venta: '',
    id_moneda_compra: null,
    id_moneda_venta: null,
    stock: '0',
  });

  const [monedas, setMonedas] = useState<MonedaRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      const monedasData = await getMonedas();
      setMonedas(monedasData);
    };
    loadInitialData();
    if (articuloId) {
      loadArticulo();
    }
  }, [articuloId]);

  const loadArticulo = async () => {
    try {
      const data = await getArticuloById(articuloId!);
      if (data) {
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          precio_compra: data.precio_compra.toString(),
          precio_venta: data.precio_venta.toString(),
          id_moneda_compra: data.id_moneda_compra,
          id_moneda_venta: data.id_moneda_venta,
          stock: data.stock.toString(),
        });
      }
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo cargar el artículo' });
    }
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      alert.showAlert({ title: 'Error', message: 'El nombre es requerido' });
      return;
    }

    const precioVenta = parseFloat(formData.precio_venta);
    if (isNaN(precioVenta) || precioVenta <= 0) {
      alert.showAlert({ title: 'Error', message: 'Ingrese un precio de venta válido' });
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: precioVenta,
        id_moneda_compra: formData.id_moneda_compra,
        id_moneda_venta: formData.id_moneda_venta,
        stock: parseInt(formData.stock) || 0,
      };

      if (isEditing) {
        await updateArticulo(articuloId!, data);
        alert.showAlert({ title: 'Éxito', message: 'Artículo actualizado correctamente' });
      } else {
        await saveArticulo(data);
        alert.showAlert({ title: 'Éxito', message: 'Artículo creado correctamente' });
      }
      navigation.goBack();
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo guardar el artículo' });
    } finally {
      setLoading(false);
    }
  };

  const monedaOptions = monedas.map(m => ({
    label: m.simbolo,
    value: m.id,
  }));

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}
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
          <Input
            label="Nombre"
            placeholder="Nombre del artículo"
            value={formData.nombre}
            onChangeText={(value) => setFormData({ ...formData, nombre: value })}
            leftIcon="package-variant-closed"
          />

          <Input
            label="Descripción"
            placeholder="Descripción del artículo"
            value={formData.descripcion}
            onChangeText={(value) => setFormData({ ...formData, descripcion: value })}
            multiline
            numberOfLines={3}
          />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Precios
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Input
                label="Precio de Compra"
                placeholder="0.00"
                value={formData.precio_compra}
                onChangeText={(value) => setFormData({ ...formData, precio_compra: value })}
                leftIcon="currency-usd"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.monedaSelect}>
              <Select
                label="Moneda"
                placeholder="Seleccionar"
                value={formData.id_moneda_compra || ''}
                options={monedaOptions}
                onChange={(value) => setFormData({ ...formData, id_moneda_compra: value as number })}
              />
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Input
                label="Precio de Venta *"
                placeholder="0.00"
                value={formData.precio_venta}
                onChangeText={(value) => setFormData({ ...formData, precio_venta: value })}
                leftIcon="currency-usd"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.monedaSelect}>
              <Select
                label="Moneda"
                placeholder="Seleccionar"
                value={formData.id_moneda_venta || ''}
                options={monedaOptions}
                onChange={(value) => setFormData({ ...formData, id_moneda_venta: value as number })}
              />
            </View>
          </View>

          <Input
            label="Stock"
            placeholder="0"
            value={formData.stock}
            onChangeText={(value) => setFormData({ ...formData, stock: value })}
            leftIcon="package-variant"
            keyboardType="number-pad"
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            icon={isEditing ? 'content-save' : 'plus-circle-outline'}
            style={styles.button}
            contentStyle={{ paddingVertical: 6 }}
          >
            {isEditing ? 'Actualizar Artículo' : 'Crear Artículo'}
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
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceInput: {
    flex: 2,
  },
  monedaSelect: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    marginTop: spacing.lg,
  },
});

export default ArticuloFormScreen;