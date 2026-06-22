import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAlert } from '../../components/AlertDialog';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from '../../components';
import { colors, spacing } from '../../theme';
import authService from '../../services/authService';
import { initializeDatabase } from '../../database';
import { RootStackParamList } from '../../navigation/AppNavigator';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alert = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 4) {
      newErrors.password = 'Mínimo 4 caracteres';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await initializeDatabase();
      await authService.saveUser({
        email: email.trim(),
        password: password,
        nombre: email.split('@')[0],
      });
      alert.showAlert({ title: 'Éxito', message: 'Usuario creado correctamente', buttons: [{ text: 'OK', onPress: () => navigation.goBack() }] });
    } catch (error: any) {
      alert.showAlert({ title: 'Error', message: error.message || 'Error al crear el usuario' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Events Planner</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Correo Electrónico"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            leftIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Contraseña"
            placeholder="Crea una contraseña"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon="lock-outline"
            secureTextEntry
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            leftIcon="lock-outline"
            secureTextEntry
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            icon="account-plus-outline"
            style={styles.button}
            contentStyle={{ paddingVertical: 6 }}
          >
            Crear Cuenta
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.loginLink}
          >
            ¿Ya tienes cuenta? Iniciar Sesión
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.layout,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    marginTop: spacing.md,
  },
  loginLink: {
    marginTop: spacing.sm,
  },
});

export default RegisterScreen;