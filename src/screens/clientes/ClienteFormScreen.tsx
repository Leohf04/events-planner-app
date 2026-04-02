import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Header } from '../../components';
import { colors, spacing } from '../../theme';
import api from '../../services/api';
import { Cliente } from './ClientesListScreen';

type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { cliente?: Cliente };
  ClienteDetail: { cliente: Cliente };
};

interface FormData {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  carnetIdentidad: string;
  gmail: string;
  direccion: string;
  telefono: string;
}

interface FormErrors {
  nombre?: string;
  primerApellido?: string;
  carnetIdentidad?: string;
  gmail?: string;
}

export const ClienteFormScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ClientesStackParamList>>();
  const route = useRoute<RouteProp<ClientesStackParamList, 'ClienteForm'>>();
  const cliente = route.params?.cliente;
  const isEditing = !!cliente;

  const [formData, setFormData] = useState<FormData>({
    nombre: cliente?.nombre || '',
    primerApellido: cliente?.primerApellido || '',
    segundoApellido: cliente?.segundoApellido || '',
    carnetIdentidad: cliente?.carnetIdentidad || '',
    gmail: cliente?.gmail || '',
    direccion: cliente?.direccion || '',
    telefono: cliente?.telefono || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.primerApellido.trim()) {
      newErrors.primerApellido = 'El primer apellido es requerido';
    }
    if (!formData.carnetIdentidad.trim()) {
      newErrors.carnetIdentidad = 'El carnet de identidad es requerido';
    }
    if (!formData.gmail.trim()) {
      newErrors.gmail = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gmail)) {
      newErrors.gmail = 'El correo no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/clientes/${cliente.id}`, formData);
        Alert.alert('Éxito', 'Cliente actualizado correctamente');
      } else {
        await api.post('/clientes', formData);
        Alert.alert('Éxito', 'Cliente creado correctamente');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        leftAction={{
          icon: '←',
          onPress: () => navigation.goBack(),
        }}
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
            placeholder="Nombre del cliente"
            value={formData.nombre}
            onChangeText={(v) => updateField('nombre', v)}
            error={errors.nombre}
            required
          />

          <Input
            label="Primer Apellido"
            placeholder="Primer apellido"
            value={formData.primerApellido}
            onChangeText={(v) => updateField('primerApellido', v)}
            error={errors.primerApellido}
            required
          />

          <Input
            label="Segundo Apellido"
            placeholder="Segundo apellido (opcional)"
            value={formData.segundoApellido}
            onChangeText={(v) => updateField('segundoApellido', v)}
          />

          <Input
            label="Carnet de Identidad"
            placeholder="Número de carnet"
            value={formData.carnetIdentidad}
            onChangeText={(v) => updateField('carnetIdentidad', v)}
            error={errors.carnetIdentidad}
            required
          />

          <Input
            label="Correo Electrónico"
            placeholder="correo@ejemplo.com"
            value={formData.gmail}
            onChangeText={(v) => updateField('gmail', v)}
            error={errors.gmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Input
            label="Dirección"
            placeholder="Dirección (opcional)"
            value={formData.direccion}
            onChangeText={(v) => updateField('direccion', v)}
          />

          <Input
            label="Teléfono"
            placeholder="Número de teléfono (opcional)"
            value={formData.telefono}
            onChangeText={(v) => updateField('telefono', v)}
            keyboardType="phone-pad"
          />

          <View style={styles.buttons}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.button}
            />
            <Button
              title={isEditing ? 'Actualizar' : 'Crear'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
            />
          </View>
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
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});
