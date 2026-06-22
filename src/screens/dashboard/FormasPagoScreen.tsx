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
import { getFormasPago, saveFormaPago, updateFormaPago, deleteFormaPago, FormaPagoRow } from '../../database/repositories/formasPagoRepository';
import { useAlert } from '../../components/AlertDialog';

export const FormasPagoScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formas, setFormas] = useState<FormaPagoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<FormaPagoRow | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formImpuesto, setFormImpuesto] = useState('');
  const alert = useAlert();

  const loadFormas = async () => {
    try {
      const data = await getFormasPago();
      setFormas(data);
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron cargar las formas de pago' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFormas();
    }, [])
  );

  const openAdd = () => {
    setEditItem(null);
    setFormNombre('');
    setFormImpuesto('0');
    setModalVisible(true);
  };

  const openEdit = (item: FormaPagoRow) => {
    setEditItem(item);
    setFormNombre(item.nombre);
    setFormImpuesto(item.impuesto.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre.trim()) {
      alert.showAlert({ title: 'Error', message: 'El nombre es requerido' });
      return;
    }
    const impuesto = parseFloat(formImpuesto) || 0;
    try {
      if (editItem) {
        await updateFormaPago(editItem.id, { nombre: formNombre.trim(), impuesto });
      } else {
        await saveFormaPago({ nombre: formNombre.trim(), impuesto });
      }
      setModalVisible(false);
      await loadFormas();
    } catch (error: any) {
      alert.showAlert({ title: 'Error', message: error.message || 'No se pudo guardar' });
    }
  };

  const handleDelete = (id: number, nombre: string) => {
    alert.showAlert({
      title: 'Confirmar',
      message: `¿Eliminar "${nombre}"?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFormaPago(id);
              await loadFormas();
            } catch (error) {
              alert.showAlert({ title: 'Error', message: 'No se pudo eliminar' });
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
        title="Formas de Pago"
        showBack
        onBack={() => navigation.goBack()}
        onAdd={openAdd}
      />

      {formas.length === 0 ? (
        <EmptyState
          message="No hay formas de pago registradas"
          icon="credit-card-outline"
          actionLabel="Agregar"
          onAction={openAdd}
        />
      ) : (
        <FlatList
          data={formas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadFormas} />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text variant="bodyMedium" style={styles.nombre}>
                    {item.nombre}
                  </Text>
                  <Text variant="bodySmall" style={styles.impuesto}>
                    Impuesto: {item.impuesto}%
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <IconButton icon="pencil" onPress={() => openEdit(item)} />
                  <IconButton
                    icon="delete"
                    iconColor={colors.error}
                    onPress={() => handleDelete(item.id, item.nombre)}
                  />
                </View>
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
          <Text variant="titleMedium" style={styles.modalTitle}>
            {editItem ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
          </Text>
          <TextInput
            label="Nombre"
            value={formNombre}
            onChangeText={setFormNombre}
            mode="outlined"
            style={styles.modalInput}
          />
          <TextInput
            label="Impuesto (%)"
            value={formImpuesto}
            onChangeText={setFormImpuesto}
            keyboardType="decimal-pad"
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
    flex: 1,
  },
  nombre: {
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  impuesto: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
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

export default FormasPagoScreen;
