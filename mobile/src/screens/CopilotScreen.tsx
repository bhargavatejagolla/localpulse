import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Text, TextInput, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useLocationContext } from '../hooks/useLocationContext';
import { getAllIssues } from '../services/database';
import { chatWithCopilot } from '../services/aiService';
import { Issue } from '../types';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export const CopilotScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { location, radiusInMeters } = useLocationContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am the LocalPulse AI Copilot. I have analyzed all civic data in your radius. How can I help you understand your neighborhood today?',
      isUser: false,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localIssues, setLocalIssues] = useState<Issue[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Floating animation for header
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    getAllIssues()
      .then(setLocalIssues)
      .catch(console.error);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, isUser: true }]);
    setLoading(true);

    const response = await chatWithCopilot(userMsg, localIssues);
    
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, isUser: false }]);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground colors={['#166534', '#22C55E', '#0B1120']} style="gridscan" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <BlurView intensity={80} tint="dark" style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ translateY: floatAnim }], flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="robot-outline" size={28} color="#22C55E" />
            <Text style={styles.headerTitle}>LocalPulse Copilot</Text>
          </Animated.View>
        </BlurView>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <Animated.View 
              key={msg.id} 
              style={[
                styles.messageWrapper, 
                msg.isUser ? styles.messageUserWrapper : styles.messageAiWrapper
              ]}
            >
              {!msg.isUser && (
                <View style={styles.aiAvatar}>
                  <MaterialCommunityIcons name="robot" size={16} color="#0B1120" />
                </View>
              )}
              <Surface style={[styles.messageBubble, msg.isUser ? styles.messageUser : styles.messageAi]} elevation={2}>
                <Text style={{ color: msg.isUser ? '#0B1120' : '#FFFFFF', lineHeight: 22 }}>
                  {msg.text}
                </Text>
              </Surface>
            </Animated.View>
          ))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#22C55E" size="small" />
              <Text style={styles.loadingText}>Analyzing civic data...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your area..."
            placeholderTextColor="#A0A0A0"
            style={[styles.input, { color: '#FFFFFF' }]}
            textColor="#FFFFFF"
            theme={{ colors: { primary: '#22C55E', background: '#111827', onSurfaceVariant: '#A0A0A0' } }}
            onSubmitEditing={handleSend}
            mode="outlined"
            outlineColor="rgba(255,255,255,0.1)"
            activeOutlineColor="#22C55E"
          />
          <TouchableOpacity 
            style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]} 
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <MaterialCommunityIcons name="send" size={20} color="#0B1120" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    zIndex: 10,
    padding: 4,
  },
  headerTitle: {
    color: '#22C55E',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageUserWrapper: {
    justifyContent: 'flex-end',
  },
  messageAiWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  messageUser: {
    backgroundColor: '#22C55E',
    borderBottomRightRadius: 4,
  },
  messageAi: {
    backgroundColor: '#111827',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    marginBottom: 16,
  },
  loadingText: {
    color: '#A0A0A0',
    marginLeft: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0B1120',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginTop: 4,
  },
});
