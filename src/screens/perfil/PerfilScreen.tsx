import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { Text, Button, IconButton, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Header, Loading, Card } from '../../components';
import { colors, spacing, borderRadius } from '../../theme';
import { getEmpresa, saveEmpresa } from '../../database/repositories/empresaRepository';
import authService, { User } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../components/AlertDialog';
import { DEFAULT_LOGO_BASE64, DEFAULT_FIRMA_BASE64 } from '../../constants/defaultImages';

type PerfilStackParamList = {
  PerfilMain: undefined;
  Monedas: undefined;
  FormasPago: undefined;
};

export const PerfilScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PerfilStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<{ nombreEmpresa?: string; email?: string }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const alert = useAlert();

  const [imagenPerfil, setImagenPerfil] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [direccionEmpresa, setDireccionEmpresa] = useState('');
  const [telefonoEmpresa, setTelefonoEmpresa] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [impuesto, setImpuesto] = useState('10');
  const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);
  const [firmaDigital, setFirmaDigital] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setImagenPerfil(user?.imagenPerfil || null);

      if (user) {
        setNombre(user.nombre || '');
        setPrimerApellido(user.primerApellido || '');
        setSegundoApellido(user.segundoApellido || '');
        setTelefono(user.telefono || '');
        setEmail(user.email || '');
        setDireccion(user.direccion || '');
      }

      const empresa = await getEmpresa();
      if (empresa) {
        setNombreEmpresa(empresa.nombre);
        setDireccionEmpresa(empresa.direccion || '');
        setTelefonoEmpresa(empresa.telefono || '');
        setEmailEmpresa(empresa.email || '');
        setImpuesto(empresa.impuesto.toString());
        setLogoEmpresa(empresa.logo || null);
        setFirmaDigital(empresa.firma || null);
      } else {
        setNombreEmpresa('Compañía Organizadora de Eventos - Events Planner');
      }
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron cargar los datos' });
    } finally {
      setLoadingData(false);
    }
  };

  const { logout } = useAuth();

  const handleLogout = () => {
    alert.showAlert({
      title: 'Cerrar Sesión',
      message: '¿Está seguro que desea cerrar sesión?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    });
  };

  const validate = (): boolean => {
    const newErrors: { nombreEmpresa?: string; email?: string } = {};

    if (!nombreEmpresa.trim()) {
      newErrors.nombreEmpresa = 'El nombre de la empresa es requerido';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingrese un correo válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startImagePicker = async (source: 'camera' | 'gallery', aspect: [number, number]) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      alert.showAlert({ title: 'Permiso denegado', message: 'Se necesita acceso a la ' + (source === 'camera' ? 'cámara' : 'galería') });
      return null;
    }
    const launcher = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await launcher({ allowsEditing: true, aspect, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const pickImage = (aspect: [number, number], onImage: (uri: string) => void) => {
    alert.showAlert({
      title: 'Seleccionar Imagen',
      message: 'Elige una opción',
      buttons: [
        {
          text: 'Cámara',
          onPress: async () => {
            const uri = await startImagePicker('camera', aspect);
            if (uri) onImage(uri);
          },
        },
        {
          text: 'Galería',
          onPress: async () => {
            const uri = await startImagePicker('gallery', aspect);
            if (uri) onImage(uri);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    });
  };

  const seleccionarImagenPerfil = () => {
    pickImage([1, 1], (uri) => setImagenPerfil(uri));
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const userData: Partial<User> = {};
      if (nombre) userData.nombre = nombre;
      if (primerApellido) userData.primerApellido = primerApellido;
      if (segundoApellido) userData.segundoApellido = segundoApellido;
      if (telefono) userData.telefono = telefono;
      if (email) userData.email = email;
      if (direccion) userData.direccion = direccion;
      if (imagenPerfil) userData.imagenPerfil = imagenPerfil;
      await authService.updateUser(currentUser!.id, userData);

      await saveEmpresa({
        nombre: nombreEmpresa,
        direccion: direccionEmpresa || null,
        telefono: telefonoEmpresa || null,
        email: emailEmpresa || null,
        logo: logoEmpresa,
        firma: firmaDigital,
        impuesto: parseFloat(impuesto) || 10,
      });

      alert.showAlert({ title: 'Éxito', message: 'Datos actualizados correctamente' });
    } catch (error) {
      alert.showAlert({ title: 'Error', message: 'No se pudieron guardar los datos' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header title="Mi Perfil" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.avatarContainer}>
          <Pressable onPress={seleccionarImagenPerfil} style={styles.avatarWrapper}>
            {imagenPerfil ? (
              <Image source={{ uri: imagenPerfil }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconButton icon="camera" size={32} />
                <Text style={styles.avatarText}>Agregar Foto</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <IconButton icon="camera" size={16} iconColor={colors.white} />
            </View>
          </Pressable>
        </View>

        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <IconButton icon="account-circle-outline" size={40} />
            <View>
              <Text variant="titleMedium" style={styles.userName}>
                {currentUser?.email || 'Usuario'}
              </Text>
              <Text variant="bodySmall" style={styles.userRole}>
                Rol: {currentUser?.role}
              </Text>
            </View>
          </View>
          <Button
            mode="outlined"
            icon="logout-variant"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Cerrar Sesión
          </Button>
        </Card>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Datos Personales
        </Text>

        <Input
          label="Nombre"
          placeholder="Tu nombre"
          value={nombre}
          onChangeText={setNombre}
          leftIcon="account-outline"
        />

        <Input
          label="Primer Apellido"
          placeholder="Tu primer apellido"
          value={primerApellido}
          onChangeText={setPrimerApellido}
        />

        <Input
          label="Segundo Apellido"
          placeholder="Tu segundo apellido"
          value={segundoApellido}
          onChangeText={setSegundoApellido}
        />

        <Input
          label="Teléfono"
          placeholder="+53 555 555 555"
          value={telefono}
          onChangeText={setTelefono}
          leftIcon="phone-outline"
          keyboardType="phone-pad"
        />

        <Input
          label="Correo Electrónico"
          placeholder="correo@email.com"
          value={email}
          onChangeText={setEmail}
          leftIcon="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Dirección"
          placeholder="Tu dirección"
          value={direccion}
          onChangeText={setDireccion}
          leftIcon="map-marker-outline"
          multiline
          numberOfLines={2}
        />

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Datos de Empresa
        </Text>

        <Text variant="bodySmall" style={styles.imageLabel}>Logo de la Empresa</Text>
        <Pressable onPress={() => pickImage([3, 2], (uri) => setLogoEmpresa(uri))} style={styles.imageSelector}>
          {logoEmpresa ? (
            <Image source={{ uri: logoEmpresa }} style={styles.logoImage} />
          ) : (
            <Image source={{ uri: DEFAULT_LOGO_BASE64 }} style={styles.logoImage} />
          )}
        </Pressable>

        <Text variant="bodySmall" style={styles.imageLabel}>Firma Digital</Text>
        <Pressable onPress={() => pickImage([3, 1], (uri) => setFirmaDigital(uri))} style={styles.imageSelector}>
          {firmaDigital ? (
            <Image source={{ uri: firmaDigital }} style={styles.firmaImage} />
          ) : (
            <Image source={{ uri: DEFAULT_FIRMA_BASE64 }} style={styles.firmaImage} />
          )}
        </Pressable>

        <Input
          label="Nombre de la Empresa"
          placeholder="Nombre de tu empresa"
          value={nombreEmpresa}
          onChangeText={setNombreEmpresa}
          error={errors.nombreEmpresa}
          leftIcon="store-outline"
        />

        <Input
          label="Dirección de la Empresa"
          placeholder="Dirección de la empresa"
          value={direccionEmpresa}
          onChangeText={setDireccionEmpresa}
          leftIcon="map-marker-outline"
          multiline
          numberOfLines={2}
        />

        <Input
          label="Teléfono de la Empresa"
          placeholder="Teléfono"
          value={telefonoEmpresa}
          onChangeText={setTelefonoEmpresa}
          leftIcon="phone-outline"
          keyboardType="phone-pad"
        />

        <Input
          label="Email de la Empresa"
          placeholder="correo@empresa.com"
          value={emailEmpresa}
          onChangeText={setEmailEmpresa}
          leftIcon="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          icon="content-save"
          style={styles.saveButton}
          contentStyle={{ paddingVertical: 6 }}
        >
          Guardar Cambios
        </Button>

        <Button
          mode="outlined"
          icon="currency-usd"
          onPress={() => navigation.navigate('Monedas')}
          style={styles.saveButton}
          contentStyle={{ paddingVertical: 6 }}
        >
          Gestionar Monedas
        </Button>

        <Button
          mode="outlined"
          icon="credit-card-outline"
          onPress={() => navigation.navigate('FormasPago')}
          style={styles.saveButton}
          contentStyle={{ paddingVertical: 6 }}
        >
          Formas de Pago
        </Button>

        <View style={styles.infoSection}>
          <IconButton icon="information" size={20} />
          <Text variant="bodySmall" style={styles.infoText}>
            Events Planner v1.0.0 - Sistema de Facturación
          </Text>
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
  form: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.component,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: -8,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userName: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  userRole: {
    color: colors.text.secondary,
  },
  logoutButton: {
    width: '100%',
  },
  saveButton: {
    marginTop: spacing.md,
  },
  imageLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  imageSelector: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 150,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  firmaImage: {
    width: 200,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePlaceholder: {
    width: 150,
    height: 100,
    backgroundColor: colors.background.component,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: -8,
  },
  infoSection: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  infoText: {
    color: colors.text.secondary,
  },
});

export default PerfilScreen;