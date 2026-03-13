import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, User, Store } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggedIn, isInitialized, loginPending, settings } = useApp();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isInitialized && isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isLoggedIn, router]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      await login({ username: username.trim(), password: password.trim() });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Store color={Colors.textWhite} size={48} />
            </View>
            <Text style={styles.restaurantName}>{settings.restaurantName}</Text>
            <Text style={styles.subtitle}>Billing System</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <User color={Colors.textSecondary} size={20} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock color={Colors.textSecondary} size={20} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loginPending && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loginPending}
            >
              {loginPending ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Default Credentials</Text>
              <Text style={styles.hintText}>Username: admin</Text>
              <Text style={styles.hintText}>Password: admin</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textWhite,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textWhite,
    opacity: 0.8,
    marginTop: 4,
  },
  formSection: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingTop: 40,
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: '700',
  },
  hintBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 2,
  },
});
