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
import { getArticulos, deleteArticulo, Articulo } from '../../services/storageService';
import { formatCurrency } from '../../utils/helpers';

type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: string };
};

export const ArticulosListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ArticulosStackParamList>>();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticulos = async () => {
    try {
      const data = await getArticulos();
      setArticulos(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los artículos');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchArticulos();
    }, [])
  );

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar',
      '¿Está seguro de eliminar este artículo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArticulo(id);
              fetchArticulos();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el artículo');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Articulo }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ArticuloForm', { articuloId: item.id })}
    >
      <Card>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.descripcion}>{item.descripcion}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.precio}>{formatCurrency(item.precio)}</Text>
              <Text style={[styles.stock, item.stock <= 5 && styles.stockLow]}>
                Stock: {item.stock}
              </Text>
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
        title="Artículos" 
        showBack 
        onBack={() => navigation.getParent()?.openDrawer()}
      />
      
      {articulos.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No hay artículos"
          message="Crea tu primer artículo tocando el botón +"
        />
      ) : (
        <FlatList
          data={articulos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
      
      <FAB onPress={() => navigation.navigate('ArticuloForm', {})} />
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
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  descripcion: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  precio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stock: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  stockLow: {
    color: colors.error,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
