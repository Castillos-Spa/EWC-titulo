import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Send, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../stores/authStore';

interface ChatModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly channelId?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  attachments?: string[];
  type: 'text' | 'image' | 'system';
}

export function ChatModal({ 
  visible, 
  onClose, 
  title = "Chat Interno",
  channelId = "general"
}: ChatModalProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      content: '¡Bienvenidos al chat interno de Empresas Wilson Castillo!',
      authorId: 'system',
      authorName: 'Sistema',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      type: 'system',
    },
    {
      id: 'msg-2',
      content: 'Hola equipo, ¿cómo van las operaciones del día?',
      authorId: 'user-004',
      authorName: 'Ana Martínez',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
    },
    {
      id: 'msg-3',
      content: 'Todo bien por aquí. Las rutas van según lo programado.',
      authorId: 'user-001',
      authorName: 'Juan Pérez',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      type: 'text',
    },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      // Scroll to bottom when modal opens
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      authorId: user?.id || 'current-user',
      authorName: user?.name || 'Usuario',
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate typing indicator and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Simulate a response from another user
      const responses = [
        'Perfecto, gracias por la actualización.',
        'Entendido, mantengan el buen trabajo.',
        '¿Necesitan algún tipo de apoyo?',
        'Excelente coordinación del equipo.',
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        content: randomResponse,
        authorId: 'user-004',
        authorName: 'Ana Martínez',
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      
      setMessages(prev => [...prev, responseMessage]);
    }, 2000);
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para enviar fotos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          content: 'Imagen compartida',
          authorId: user?.id || 'current-user',
          authorName: user?.name || 'Usuario',
          timestamp: new Date().toISOString(),
          attachments: [result.assets[0].uri],
          type: 'image',
        };

        setMessages(prev => [...prev, imageMessage]);
      }
    } catch (error) {
      console.error('No se pudo acceder a la cámara:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getMessageBubbleStyle = (authorId: string) => {
    const isCurrentUser = authorId === user?.id;
    const isSystem = authorId === 'system';
    
    if (isSystem) {
      return [styles.messageBubble, styles.systemMessage];
    }
    
    return [
      styles.messageBubble,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
    ];
  };

  const getMessageTextStyle = (authorId: string) => {
    const isCurrentUser = authorId === user?.id;
    const isSystem = authorId === 'system';
    
    if (isSystem) {
      return [styles.messageText, styles.systemMessageText];
    }
    
    return [
      styles.messageText,
      isCurrentUser ? styles.currentUserMessageText : styles.otherUserMessageText,
    ];
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {messages.filter(m => m.type !== 'system').length} mensajes
            </Text>
          </View>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>En línea</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.authorId === user?.id && styles.currentUserContainer,
                message.authorId === 'system' && styles.systemContainer,
              ]}
            >
              {message.authorId !== user?.id && message.authorId !== 'system' && (
                <View style={styles.messageHeader}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorInitial}>
                      {message.authorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.authorName}>{message.authorName}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              )}
              
              <View style={getMessageBubbleStyle(message.authorId)}>
                <Text style={getMessageTextStyle(message.authorId)}>
                  {message.content}
                </Text>
                
                {message.attachments && message.attachments.length > 0 && (
                  <View style={styles.attachments}>
                    {message.attachments.map((attachment) => (
                      <View key={attachment} style={styles.attachment}>
                        <Camera size={16} color="#64748B" />
                        <Text style={styles.attachmentText}>Imagen</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              {message.authorId === user?.id && (
                <Text style={styles.currentUserTime}>
                  {formatTime(message.timestamp)}
                </Text>
              )}
            </View>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
              <Text style={styles.typingText}>Ana está escribiendo...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton} onPress={handleTakePhoto}>
              <Camera size={24} color="#64748B" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  currentUserContainer: {
    alignSelf: 'flex-end',
  },
  systemContainer: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  messageTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  currentUserMessage: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 6,
  },
  otherUserMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  systemMessage: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  currentUserMessageText: {
    color: '#FFFFFF',
  },
  otherUserMessageText: {
    color: '#1E293B',
  },
  systemMessageText: {
    color: '#1E40AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  currentUserTime: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  attachments: {
    marginTop: 8,
    gap: 4,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typingContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: '#94A3B8',
    borderRadius: 4,
  },
  typingDot1: {
    // Animation would be added here in a real implementation
  },
  typingDot2: {
    // Animation would be added here in a real implementation
  },
  typingDot3: {
    // Animation would be added here in a real implementation
  },
  typingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachButton: {
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});