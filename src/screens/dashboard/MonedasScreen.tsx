import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Text, IconButton, Button, TextInput, Modal, Portal } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Header, EmptyState, Loading } from '../../components';
import { colors, spacing } from '../../theme';
import { getMonedas, saveMoneda, deleteMoneda, MonedaRow } from '../../database/repositories/monedasRepository';
import { useAlert } from '../../components/AlertDialog';

export const MonedasScreen: React.FC = () => {
  const navigation = useNavigation();
  const [monedas, setMonedas] = useState<MonedaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formSimbolo, setFormSimbolo] = useState('');
  const alert = useAlert();

  const loadMonedas = async () => {
    try {
      const data = await getMonedas();
      setMonedas(data);
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron cargar las monedas' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMonedas();
    }, [])
  );

  const handleAdd = () => {
    setFormNombre('');
    setFormSimbolo('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre.trim() || !formSimbolo.trim()) {
      alert.showAlert({ title: 'Error', message: 'Todos los campos son requeridos' });
      return;
    }
    try {
      await saveMoneda({ nombre: formNombre.trim(), simbolo: formSimbolo.trim() });
      setModalVisible(false);
      await loadMonedas();
    } catch (error: any) {
      alert.showAlert({ title: 'Error', message: error.message || 'No se pudo guardar' });
    }
  };

  const handleDelete = (id: number, nombre: string) => {
    alert.showAlert({
      title: 'Confirmar',
      message: `¿Eliminar la moneda "${nombre}"?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMoneda(id);
              await loadMonedas();
            } catch (error) {
              alert.showAlert({ title: 'Error', message: 'No se pudo eliminar la moneda' });
            }
          },
        },
      ],
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Monedas"
        showBack
        onBack={() => navigation.goBack()}
        onAdd={handleAdd}
      />

      {monedas.length === 0 ? (
        <EmptyState
          message="No hay monedas registradas"
          icon="currency-usd"
          actionLabel="Agregar Moneda"
          onAction={handleAdd}
        />
      ) : (
        <FlatList
          data={monedas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadMonedas} />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text variant="bodyMedium" style={styles.nombre}>
                    {item.nombre}
                  </Text>
                  <Text variant="bodyLarge" style={styles.simbolo}>
                    {item.simbolo}
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  iconColor={colors.error}
                  onPress={() => handleDelete(item.id, item.nombre)}
                />
              </View>
            </Card>
          )}
        />
      )}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>Nueva Moneda</Text>
          <TextInput
            label="Nombre"
            value={formNombre}
            onChangeText={setFormNombre}
            mode="outlined"
            style={styles.modalInput}
          />
          <TextInput
            label="Símbolo"
            value={formSimbolo}
            onChangeText={setFormSimbolo}
            mode="outlined"
            style={styles.modalInput}
          />
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.modalButton}>
              Guardar
            </Button>
          </View>
        </Modal>
      </Portal>
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
  card: {
    marginBottom: spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  nombre: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  simbolo: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 24,
  },
  modal: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  modalInput: {
    marginBottom: spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    minWidth: 100,
  },
});

export default MonedasScreen;
