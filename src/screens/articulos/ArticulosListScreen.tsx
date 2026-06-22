import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Searchbar, IconButton, Menu, Divider, Chip, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, Loading, Header } from '../../components';
import { useAlert } from '../../components/AlertDialog';
import { colors, spacing } from '../../theme';
import { getArticulos, deleteArticulo, searchArticulos, ArticuloRow } from '../../database/repositories/articulosRepository';
import { getMonedaById } from '../../database/repositories/monedasRepository';
import { formatCurrency } from '../../utils/helpers';

type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: number };
  MovimientosStock: { articuloId: number; articuloNombre: string };
};

export const ArticulosListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ArticulosStackParamList>>();
  const alert = useAlert();
  const [articulos, setArticulos] = useState<ArticuloRow[]>([]);
  const [monedaSimbolos, setMonedaSimbolos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchArticulos = useCallback(async (query?: string) => {
    try {
      const data = query?.trim() ? await searchArticulos(query) : await getArticulos();
      setArticulos(data);

      const simbolos: Record<number, string> = {};
      for (const art of data) {
        if (art.id_moneda_venta && !simbolos[art.id_moneda_venta]) {
          const moneda = await getMonedaById(art.id_moneda_venta);
          if (moneda) simbolos[art.id_moneda_venta] = moneda.simbolo;
        }
      }
      setMonedaSimbolos(simbolos);
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron cargar los artículos' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchArticulos(searchQuery);
    }, [fetchArticulos, searchQuery])
  );

  const onChangeSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setLoading(true);
    searchTimer.current = setTimeout(() => {
      fetchArticulos(text);
    }, 300);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchArticulos();
  };

  const handleDelete = (id: number) => {
    alert.showAlert({
      title: 'Confirmar',
      message: '¿Está seguro de eliminar este artículo?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArticulo(id);
              await fetchArticulos();
            } catch (error) {
              alert.showAlert({ title: 'Error', message: 'No se pudo eliminar el artículo' });
            }
          },
        },
      ],
    });
  };

  const renderArticulo = ({ item }: { item: ArticuloRow }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ArticuloForm', { articuloId: item.id })}
        style={styles.cardTouchable}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.articuloName}>
              {item.nombre}
            </Text>
            {item.descripcion && (
              <Text variant="bodySmall" style={styles.infoText}>
                {item.descripcion}
              </Text>
            )}
            <Text variant="bodyMedium" style={styles.precio}>
              {formatCurrency(item.precio_venta, monedaSimbolos[item.id_moneda_venta || 0] || '$')}
            </Text>
            <Chip
              icon={item.stock > 0 ? 'check-circle-outline' : 'alert-circle-outline'}
              style={item.stock > 0 ? styles.stockOk : styles.stockLow}
              textStyle={{ fontSize: 12 }}
            >
              Stock: {item.stock}
            </Chip>
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
              leadingIcon="history"
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('MovimientosStock', { articuloId: item.id, articuloNombre: item.nombre });
              }}
              title="Historial"
            />
            <Divider />
            <Menu.Item
              leadingIcon="pencil"
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('ArticuloForm', { articuloId: item.id });
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

  if (loading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Artículos" />
      <Searchbar
        placeholder="Buscar artículos..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchbar}
        icon="magnify"
        clearIcon="close-circle"
      />
      {articulos.length === 0 ? (
        <EmptyState
          message="No hay artículos"
          icon="package-variant-closed"
          actionLabel="Crear Artículo"
          onAction={() => navigation.navigate('ArticuloForm', {})}
        />
      ) : (
        <FlatList
          data={articulos}
          renderItem={renderArticulo}
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
          onPress={() => navigation.navigate('ArticuloForm', {})}
          contentStyle={{ paddingVertical: 6 }}
        >
          Crear Artículo
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
  searchbar: {
    margin: spacing.md,
    backgroundColor: colors.white,
  },
  list: {
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
  articuloName: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  precio: {
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  stockOk: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  stockLow: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(176, 0, 32, 0.12)',
  },
  bottomButton: {
    padding: spacing.md,
    paddingTop: 0,
  },
});

export default ArticulosListScreen;