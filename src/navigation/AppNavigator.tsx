import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { colors, spacing } from '../theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useAuth } from '../contexts/AuthContext';
import { initializeDatabase } from '../database';

// Screens - Clientes
import { ClientesListScreen } from '../screens/clientes/ClientesListScreen';
import { ClienteFormScreen } from '../screens/clientes/ClienteFormScreen';

// Screens - Artículos
import { ArticulosListScreen } from '../screens/articulos/ArticulosListScreen';
import { ArticuloFormScreen } from '../screens/articulos/ArticuloFormScreen';
import { MovimientosStockScreen } from '../screens/articulos/MovimientosStockScreen';

// Screens - Facturas
import { FacturasListScreen } from '../screens/facturas/FacturasListScreen';
import { FacturaFormScreen } from '../screens/facturas/FacturaFormScreen';
import { FacturaDetailScreen } from '../screens/facturas/FacturaDetailScreen';

// Screens - Dashboard
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';

// Screens - Perfil
import { PerfilScreen } from '../screens/perfil/PerfilScreen';

// Screens - Monedas
import { MonedasScreen } from '../screens/dashboard/MonedasScreen';

// Screens - Formas de Pago
import { FormasPagoScreen } from '../screens/dashboard/FormasPagoScreen';

SplashScreen.preventAutoHideAsync();

// Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type TabParamList = {
  DashboardTab: undefined;
  ClientesTab: undefined;
  ArticulosTab: undefined;
  FacturasTab: undefined;
  PerfilTab: undefined;
};

export type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { clienteId?: number };
};

export type ArticulosStackParamList = {
  ArticulosList: undefined;
  ArticuloForm: { articuloId?: number };
  MovimientosStock: { articuloId: number; articuloNombre: string };
};

export type FacturasStackParamList = {
  FacturasList: undefined;
  FacturaForm: { facturaId?: number };
  FacturaDetail: { facturaId: number };
};

export type PerfilStackParamList = {
  PerfilMain: undefined;
  Monedas: undefined;
  FormasPago: undefined;
};

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const ClientesStack = createNativeStackNavigator<ClientesStackParamList>();
const ArticulosStack = createNativeStackNavigator<ArticulosStackParamList>();
const FacturasStack = createNativeStackNavigator<FacturasStackParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

function ClientesStackScreen() {
  return (
    <ClientesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientesStack.Screen name="ClientesList" component={ClientesListScreen} />
      <ClientesStack.Screen name="ClienteForm" component={ClienteFormScreen} />
    </ClientesStack.Navigator>
  );
}

function ArticulosStackScreen() {
  return (
    <ArticulosStack.Navigator screenOptions={{ headerShown: false }}>
      <ArticulosStack.Screen name="ArticulosList" component={ArticulosListScreen} />
      <ArticulosStack.Screen name="ArticuloForm" component={ArticuloFormScreen} />
      <ArticulosStack.Screen name="MovimientosStock" component={MovimientosStockScreen} />
    </ArticulosStack.Navigator>
  );
}

function FacturasStackScreen() {
  return (
    <FacturasStack.Navigator screenOptions={{ headerShown: false }}>
      <FacturasStack.Screen name="FacturasList" component={FacturasListScreen} />
      <FacturasStack.Screen name="FacturaForm" component={FacturaFormScreen} />
      <FacturasStack.Screen name="FacturaDetail" component={FacturaDetailScreen} />
    </FacturasStack.Navigator>
  );
}

function PerfilStackScreen() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="PerfilMain" component={PerfilScreen} />
      <PerfilStack.Screen name="Monedas" component={MonedasScreen} />
      <PerfilStack.Screen name="FormasPago" component={FormasPagoScreen} />
    </PerfilStack.Navigator>
  );
}

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={focused ? colors.primary : colors.text.disabled}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary : colors.text.disabled },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="view-dashboard-outline" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ClientesTab"
        component={ClientesStackScreen}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="account-group-outline" label="Clientes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ArticulosTab"
        component={ArticulosStackScreen}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="package-variant-closed" label="Artículos" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="FacturasTab"
        component={FacturasStackScreen}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="file-document-outline" label="Facturas" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilStackScreen}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="cog-outline" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('DB init error:', error);
      } finally {
        setIsDbReady(true);
        SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  if (!isDbReady || isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <AuthStack.Screen name="Main" component={MainTabs} />
        )}
      </AuthStack.Navigator>
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
  loadingText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  tabBar: {
    backgroundColor: colors.background.component,
    borderTopWidth: 0,
    height: 70,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: spacing.xs,
  },
});

export default AppNavigator;