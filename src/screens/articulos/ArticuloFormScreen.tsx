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
import { Button, Input, Header } from '../../components';
import { colors, spacing } from '../../theme';
import { saveArticulo, updateArticulo, getArticuloById, Articulo } from '../../services/storageService';

type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: string };
};

export const ArticuloFormScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ArticulosStackParamList>>();
  const route = useRoute<RouteProp<ArticulosStackParamList, 'ArticuloForm'>>();
  const { articuloId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    if (articuloId) {
      loadArticulo();
    }
  }, [articuloId]);

  const loadArticulo = async () => {
    try {
      const articulo = await getArticuloById(articuloId!);
      if (articulo) {
        setNombre(articulo.nombre);
        setDescripcion(articulo.descripcion);
        setPrecio(articulo.precio.toString());
        setStock(articulo.stock.toString());
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el artículo');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!precio || parseFloat(precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }
    if (!stock || parseInt(stock) < 0) {
      newErrors.stock = 'El stock debe ser mayor o igual a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const articuloData = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        stock: parseInt(stock),
      };

      if (articuloId) {
        await updateArticulo(articuloId, articuloData);
      } else {
        await saveArticulo(articuloData);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el artículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={articuloId ? 'Editar Artículo' : 'Nuevo Artículo'}
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Input
            label="Nombre"
            placeholder="Ingrese el nombre del artículo"
            value={nombre}
            onChangeText={setNombre}
            error={errors.nombre}
          />

          <Input
            label="Descripción"
            placeholder="Ingrese la descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Precio"
            placeholder="0.00"
            value={precio}
            onChangeText={setPrecio}
            error={errors.precio}
            keyboardType="decimal-pad"
          />

          <Input
            label="Stock"
            placeholder="0"
            value={stock}
            onChangeText={setStock}
            error={errors.stock}
            keyboardType="number-pad"
          />

          <Button
            title={articuloId ? 'Actualizar' : 'Crear'}
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
  button: {
    marginTop: spacing.lg,
  },
});
