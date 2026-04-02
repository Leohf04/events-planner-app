import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { colors, spacing } from '../theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import authService from '../services/authService';
import api from '../services/api';

// Screens - Clientes
import { ClientesListScreen } from '../screens/clientes/ClientesListScreen';
import { ClienteFormScreen } from '../screens/clientes/ClienteFormScreen';

// Screens - Artículos
import { ArticulosListScreen } from '../screens/articulos/ArticulosListScreen';
import { ArticuloFormScreen } from '../screens/articulos/ArticuloFormScreen';

// Screens - Facturas
import { FacturasListScreen } from '../screens/facturas/FacturasListScreen';
import { FacturaFormScreen } from '../screens/facturas/FacturaFormScreen';
import { FacturaDetailScreen } from '../screens/facturas/FacturaDetailScreen';

// Screens - Perfil
import { PerfilScreen } from '../screens/perfil/PerfilScreen';

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type DrawerParamList = {
  ClientesStack: undefined;
  ArticulosStack: undefined;
  FacturasStack: undefined;
  Perfil: undefined;
};

export type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { clienteId?: string };
};

export type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: string };
};

export type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: string };
  FacturaDetail: { facturaId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const Tab = createBottomTabNavigator();

const DrawerContent = (props: any) => {
  const handleLogout = async () => {
    await api.logout();
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Text style={styles.logo}>🎉</Text>
        <Text style={styles.appName}>Events Planner</Text>
        <Text style={styles.appSubtitle}>Sistema de Facturación</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Cerrar Sesión"
        onPress={handleLogout}
        labelStyle={styles.logoutLabel}
        icon={() => <Text style={styles.logoutIcon}>🚪</Text>}
      />
    </DrawerContentScrollView>
  );
};

function ClientesStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientesList" component={ClientesListScreen} />
      <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
    </Stack.Navigator>
  );
}

function ArticulosStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ArticulosList" component={ArticulosListScreen} />
      <Stack.Screen name="ArticuloForm" component={ArticuloFormScreen} />
    </Stack.Navigator>
  );
}

function FacturasStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FacturasList" component={FacturasListScreen} />
      <Stack.Screen name="FacturaForm" component={FacturaFormScreen} />
      <Stack.Screen name="FacturaDetail" component={FacturaDetailScreen} />
    </Stack.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: colors.primary + '20',
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text.secondary,
        drawerLabelStyle: styles.drawerLabel,
      }}
    >
      <Drawer.Screen
        name="ClientesStack"
        component={ClientesStackScreen}
        options={{
          title: 'Clientes',
          drawerIcon: () => <Text style={styles.drawerIcon}>👤</Text>,
        }}
      />
      <Drawer.Screen
        name="ArticulosStack"
        component={ArticulosStackScreen}
        options={{
          title: 'Artículos',
          drawerIcon: () => <Text style={styles.drawerIcon}>📦</Text>,
        }}
      />
      <Drawer.Screen
        name="FacturasStack"
        component={FacturasStackScreen}
        options={{
          title: 'Facturas',
          drawerIcon: () => <Text style={styles.drawerIcon}>📄</Text>,
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'Perfil',
          drawerIcon: () => <Text style={styles.drawerIcon}>⚙️</Text>,
        }}
      />
    </Drawer.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🎉</Text>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.layout,
  },
  loadingLogo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  drawerHeader: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  appSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  drawerLabel: {
    fontSize: 16,
    marginLeft: -10,
  },
  drawerIcon: {
    fontSize: 20,
  },
  logoutLabel: {
    color: colors.error,
    fontSize: 16,
  },
  logoutIcon: {
    fontSize: 20,
  },
});

export default AppNavigator;
