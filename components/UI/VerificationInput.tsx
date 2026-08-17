import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  KeyboardTypeOptions,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

interface VerificationInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
}

export default function VerificationInput({
  length,
  value,
  onChange,
  keyboardType = 'number-pad',
  error,
}: VerificationInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    // Initialize array with correct length
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChangeText = (text: string, index: number) => {
    const newValue = value.split('');
    if (text.length > 0) {
      newValue[index] = text[text.length - 1];
      onChange(newValue.join(''));
      // Auto focus to next input if available
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Handle deletion
      newValue[index] = '';
      onChange(newValue.join(''));
      // Optionally, move focus to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace - move to previous input if current is empty
    if (e.nativeEvent.key === 'Backspace' && index > 0 && !value[index]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array(length)
          .fill(0)
          .map((_, index) => (
            <View
              key={index}
              style={[
                styles.inputWrapper,
                focusedIndex === index && styles.focusedInputWrapper,
                error && styles.errorInputWrapper,
              ]}
            >
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.input}
                keyboardType={keyboardType}
                maxLength={1}
                value={value[index] || ''}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                selectTextOnFocus
              />
            </View>
          ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Layout.spacing.m,
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: Layout.borderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
  },
  focusedInputWrapper: {
    borderColor: Colors.primary.default,
    borderWidth: 2,
  },
  errorInputWrapper: {
    borderColor: Colors.error.default,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary.default,
  },
  errorText: {
    color: Colors.error.default,
    fontSize: 12,
    marginTop: Layout.spacing.s,
    textAlign: 'center',
  },
});
