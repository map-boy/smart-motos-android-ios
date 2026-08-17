import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { colors, typography, spacing, borderRadius } from '@/styles/theme'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const CustomerSupport = () => {
  const [message, setMessage] = useState('')

  const handleSendMessage = () => {
    // Handle sending message logic here
    console.log('Message sent:', message)
    setMessage('')
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Customer support',
          headerStyle: { backgroundColor: colors.background.default },
          headerTintColor: colors.text.primary,
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat messages display area */}
        <View style={styles.messagesContainer}>
          {/* Example welcome message */}
          <View style={[styles.chatBubble, styles.botBubble]}>
            <Text style={styles.chatText}>Hi, how can I help you?</Text>
          </View>
        </View>

        {/* Message input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter message..."
            placeholderTextColor={colors.text.secondary}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={24} color={colors.primary.contrastText} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default CustomerSupport

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  messagesContainer: {
    flex: 1,
    padding: spacing.md,
    // Add styling for messages list here
  },
  chatBubble: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  botBubble: {
    backgroundColor: colors.background.paper,
    alignSelf: 'flex-start',
  },
  chatText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background.paper,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.background.default,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
  },
  sendButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
})