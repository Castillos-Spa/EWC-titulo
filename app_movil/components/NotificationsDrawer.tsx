import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, Animated, Easing, FlatList, useWindowDimensions } from 'react-native';
import { X as Close, Bell } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { AppNotification, useNotificationsStore } from '@/stores/notificationsStore';

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
}>;

export function NotificationsDrawer({ visible, onClose }: Props) {
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { items, clear, markAsRead } = useNotificationsStore();

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, height, translateY]);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: colors.primary + '15',
        }}
      >
        <Bell size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          {item.message || item.type || 'Notificación'}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
          {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!item.read && (
        <Pressable
          onPress={() => markAsRead(item.id)}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background }}
        >
          <Text style={{ color: colors.primary, fontSize: 12 }}>Marcar leído</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: Math.min(0.8 * height, 640),
          backgroundColor: colors.surface,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 1,
          borderColor: colors.border,
          transform: [{ translateY }],
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
            Notificaciones
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => {
                // Marcar todos como leídos (optimista)
                for (const notification of items) {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Marcar todo</Text>
            </Pressable>
            <Pressable
              onPress={clear}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Limpiar</Text>
            </Pressable>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Close size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Lista */}
        {items.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Bell size={28} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Sin notificaciones</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

export default NotificationsDrawer;
