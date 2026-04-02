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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Header, Loading } from '../../components';
import { colors, spacing } from '../../theme';
import { getEmpresa, saveEmpresa, updateEmpresa, Empresa } from '../../services/storageService';

type PerfilStackParamList = {
  Perfil: undefined;
};

export const PerfilScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PerfilStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<{ nombre?: string; email?: string }>({});
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [nit, setNit] = useState('');

  useEffect(() => {
    loadEmpresa();
  }, []);

  const loadEmpresa = async () => {
    try {
      const empresa = await getEmpresa();
      if (empresa) {
        setNombre(empresa.nombre);
        setTelefono(empresa.telefono);
        setDireccion(empresa.direccion);
        setEmail(empresa.email);
        setNit(empresa.nit);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de la empresa');
    } finally {
      setLoadingData(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { nombre?: string; email?: string } = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre de la empresa es requerido';
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingrese un correo válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const empresaData = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        email: email.trim(),
        nit: nit.trim(),
      };

      const existing = await getEmpresa();
      if (existing) {
        await updateEmpresa(empresaData);
      } else {
        await saveEmpresa(empresaData);
      }
      
      Alert.alert('Éxito', 'Datos de la empresa actualizados correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Perfil de Empresa" 
        showBack 
        onBack={() => navigation.getParent()?.openDrawer()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.sectionTitle}>Información de la Empresa</Text>
          
          <Input
            label="Nombre de la Empresa"
            placeholder="Nombre de tu empresa"
            value={nombre}
            onChangeText={setNombre}
            error={errors.nombre}
          />
          
          <Input
            label="NIT"
            placeholder="Número de identificación tributaria"
            value={nit}
            onChangeText={setNit}
          />
          
          <Input
            label="Correo Electrónico"
            placeholder="correo@empresa.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          
          <Input
            label="Teléfono"
            placeholder="+53 555 555 555"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
          
          <Input
            label="Dirección"
            placeholder="Dirección de la empresa"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            numberOfLines={2}
          />
          
          <Button
            title="Guardar Cambios"
            onPress={handleSave}
            loading={loading}
            style={styles.button}
          />
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Acerca de la App</Text>
            <Text style={styles.infoText}>Events Planner v1.0.0</Text>
            <Text style={styles.infoText}>Sistema de Facturación</Text>
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
  content: {
    flex: 1,
  },
  form: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
  infoSection: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.background.component,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
