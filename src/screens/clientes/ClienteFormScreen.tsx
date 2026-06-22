import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Header } from '../../components';
import { colors, spacing } from '../../theme';
import {
  saveCliente,
  updateCliente,
  getClienteById,
} from '../../database/repositories/clientesRepository';
import { useAlert } from '../../components/AlertDialog';

type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { clienteId?: number };
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
  const { clienteId } = route.params || {};
  const isEditing = !!clienteId;

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    carnetIdentidad: '',
    gmail: '',
    direccion: '',
    telefono: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  useEffect(() => {
    if (clienteId) {
      loadCliente();
    }
  }, [clienteId]);

  const loadCliente = async () => {
    try {
      const clienteData = await getClienteById(clienteId!);
      if (clienteData) {
        setFormData({
          nombre: clienteData.nombre,
          primerApellido: clienteData.primerApellido,
          segundoApellido: clienteData.segundoApellido || '',
          carnetIdentidad: clienteData.carnetIdentidad || '',
          gmail: clienteData.gmail || '',
          direccion: clienteData.direccion || '',
          telefono: clienteData.telefono || '',
        });
      }
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo cargar el cliente' });
    }
  };

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
        await updateCliente(clienteId!, formData);
        alert.showAlert({ title: 'Éxito', message: 'Cliente actualizado correctamente' });
      } else {
        await saveCliente(formData);
        alert.showAlert({ title: 'Éxito', message: 'Cliente creado correctamente' });
      }
      navigation.goBack();
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudo guardar el cliente' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
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
            placeholder="Nombre del cliente"
            value={formData.nombre}
            onChangeText={(value) => updateField('nombre', value)}
            error={errors.nombre}
            leftIcon="account-outline"
          />

          <Input
            label="Primer Apellido"
            placeholder="Primer apellido"
            value={formData.primerApellido}
            onChangeText={(value) => updateField('primerApellido', value)}
            error={errors.primerApellido}
          />

          <Input
            label="Segundo Apellido"
            placeholder="Segundo apellido"
            value={formData.segundoApellido}
            onChangeText={(value) => updateField('segundoApellido', value)}
          />

          <Input
            label="Carnet de Identidad"
            placeholder="Número de identidad"
            value={formData.carnetIdentidad}
            onChangeText={(value) => updateField('carnetIdentidad', value)}
            error={errors.carnetIdentidad}
            leftIcon="card-account-details-outline"
          />

          <Input
            label="Correo Electrónico"
            placeholder="correo@ejemplo.com"
            value={formData.gmail}
            onChangeText={(value) => updateField('gmail', value)}
            error={errors.gmail}
            leftIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Teléfono"
            placeholder="+53 555 555 555"
            value={formData.telefono}
            onChangeText={(value) => updateField('telefono', value)}
            leftIcon="phone-outline"
            keyboardType="phone-pad"
          />

          <Input
            label="Dirección"
            placeholder="Dirección del cliente"
            value={formData.direccion}
            onChangeText={(value) => updateField('direccion', value)}
            leftIcon="map-marker-outline"
            multiline
            numberOfLines={3}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            icon={isEditing ? 'content-save' : 'plus-circle-outline'}
            style={styles.button}
            contentStyle={{ paddingVertical: 6 }}
          >
            {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
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
  button: {
    marginTop: spacing.lg,
  },
});

export default ClienteFormScreen;