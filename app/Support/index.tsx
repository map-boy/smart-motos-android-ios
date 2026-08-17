"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native"
import Colors from "@/constants/Colors"
import Layout from "@/constants/Layout"
import { ChevronLeft, Smile, Mic, Send } from "lucide-react-native"
import { useRouter } from "expo-router"

export default function SupportScreen() {
  const router = useRouter()
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message logic here
      setMessage("")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary.default} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft color={Colors.primary.default} size={24} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Customer Support</Text>
            <Text style={styles.headerSubtitle}>We're here to help</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.onlineIndicator} />
          </View>
        </View>
      </View>

      {/* Chat area */}
      <ScrollView
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeMessage}>
          <Text style={styles.welcomeText}>Welcome to support! We typically respond within a few minutes.</Text>
        </View>

        <View style={styles.messageContainer}>
          <View style={styles.supportMessage}>
            <View style={styles.supportAvatar}>
              <Smile color={Colors.primary.default} size={18} />
            </View>
            <View style={styles.supportBubble}>
              <Text style={styles.supportText}>Hi there! 👋 How can I help you today?</Text>
              <Text style={styles.messageTime}>Just now</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
              <Smile color={Colors.primary.default} size={22} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={Colors.neutral.light}
              multiline
              maxLength={500}
            />

            {message.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.8}>
                <Send color={Colors.secondary.default} size={20} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micButton} activeOpacity={0.7}>
                <Mic color={Colors.primary.default} size={22} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputFooter}>
            <Text style={styles.inputHint}>Press Enter to send • Shift+Enter for new line</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.default,
  },
  header: {
    backgroundColor: Colors.secondary.default,
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.dark + "30",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Layout.spacing.l,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral.dark + "20",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    color: Colors.primary.default,
    fontSize: 13,
    fontWeight: "500",
  },
  headerRight: {
    alignItems: "center",
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: Colors.secondary.default,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.secondary.default,
  },
  chatContent: {
    paddingHorizontal: Layout.spacing.l,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeMessage: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    color: Colors.neutral.light,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  supportMessage: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  supportAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary.default,
    borderWidth: 2,
    borderColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: Colors.primary.default,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  supportBubble: {
    backgroundColor: Colors.primary.default,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportText: {
    color: Colors.secondary.default,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  messageTime: {
    color: Colors.secondary.default + "80",
    fontSize: 11,
    fontWeight: "400",
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: Colors.secondary.default,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.dark + "30",
    paddingHorizontal: Layout.spacing.l,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 20 : 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.neutral.white,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiButton: {
    padding: 12,
    borderRadius: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary.default,
    paddingVertical: 12,
    paddingHorizontal: 8,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: Colors.primary.default,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
    shadowColor: Colors.primary.default,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  micButton: {
    padding: 12,
    borderRadius: 20,
  },
  inputFooter: {
    alignItems: "center",
    marginTop: 8,
  },
  inputHint: {
    color: Colors.neutral.light,
    fontSize: 12,
    fontWeight: "400",
  },
})
