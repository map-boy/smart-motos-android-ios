import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
  TextStyle,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  secureTextEntry?: boolean;
  labelStyle?: StyleProp<TextStyle>;
  placeholderTextColor?: string;
}

export default function Input({
  label,
  error,
  containerStyle,
  secureTextEntry,
  labelStyle,
  placeholderTextColor,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={placeholderTextColor || Colors.neutral.medium}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.iconContainer}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={Colors.neutral.dark} />
            ) : (
              <Eye size={20} color={Colors.neutral.dark} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.m,
    width: '100%',
  },
  label: {
    marginBottom: Layout.spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.darker,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: Layout.borderRadius.m,
    backgroundColor: Colors.neutral.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.m,
    fontSize: 16,
    color: Colors.secondary.default,
  },
  focusedInput: {
    borderColor: Colors.primary.default,
  },
  errorInput: {
    borderColor: Colors.error.default,
  },
  errorText: {
    color: Colors.error.default,
    fontSize: 12,
    marginTop: Layout.spacing.xs,
  },
  iconContainer: {
    paddingHorizontal: Layout.spacing.m,
  },
});