import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [buttonScale] = useState(new Animated.Value(1));

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Home');
    }, 1500);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <LinearGradient
      colors={isDarkMode 
        ? ['#0f0c29', '#302b63', '#24243e'] 
        : ['#667eea', '#764ba2', '#6B8DD6']}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>        
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={[styles.logo, theme.logo]}>
              <Text style={styles.logoText}>✓</Text>
            </View>
            <Text style={[styles.title, theme.text]}>Todo App</Text>
            <Text style={[styles.subtitle, theme.subtitle]}>Organize your life</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, theme.inputContainer]}>              
              <TextInput
                style={[styles.input, theme.input]}
                placeholder="Email address"
                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                selectionColor={isDarkMode ? '#667eea' : '#764ba2'}
              />
            </View>
            
            <View style={[styles.inputContainer, theme.inputContainer]}>
              <TextInput
                style={[styles.input, theme.input]}
                placeholder="Password"
                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                selectionColor={isDarkMode ? '#667eea' : '#764ba2'}
              />
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={[styles.button, theme.button, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity>
              <Text style={[styles.forgotText, theme.forgotText]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, theme.footerText]}>
              Don't have an account? {' '}
              <Text style={[styles.linkText, theme.linkText]}>Sign Up</Text>
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const lightTheme = {
  text: { color: '#ffffff' },
  subtitle: { color: 'rgba(255,255,255,0.8)' },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: {
    backgroundColor: 'transparent',
    color: '#fff',
  },
  button: { backgroundColor: '#fff' },
  forgotText: { color: 'rgba(255,255,255,0.8)' },
  footerText: { color: 'rgba(255,255,255,0.8)' },
  linkText: { color: '#fff', fontWeight: '600' },
  logo: { backgroundColor: 'rgba(255,255,255,0.2)' },
};

const darkTheme = {
  text: { color: '#ffffff' },
  subtitle: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  input: {
    backgroundColor: 'transparent',
    color: '#fff',
  },
  button: { backgroundColor: '#667eea' },
  forgotText: { color: 'rgba(255,255,255,0.7)' },
  footerText: { color: 'rgba(255,255,255,0.7)' },
  linkText: { color: '#a8b2ff', fontWeight: '600' },
  logo: { backgroundColor: 'rgba(255,255,255,0.15)' },
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '300',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
  },
});

export default LoginScreen;