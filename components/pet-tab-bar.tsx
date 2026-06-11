import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { useAlertNotifications } from '@/contexts/alert-notifications-context';
import { useInbox } from '@/contexts/inbox-context';
import { useUser } from '@/contexts/user-context';

const tabs = [
  { name: 'index', icon: '🏠', label: 'Home' },
  { name: 'pets', icon: '🐾', label: 'Pets' },
  { name: 'alerts', icon: '🚨', label: 'Alerts' },
  { name: 'inbox', icon: '💬', label: 'Inbox' },
  { name: 'account', icon: '👤', label: 'Account' },
];

export function PetTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadCount: alertUnread } = useAlertNotifications();
  const { unreadCount: inboxUnreadCount } = useInbox();
  const { owner } = useUser();
  const inboxUnread = inboxUnreadCount(owner?.email);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = tabs.find((t) => t.name === route.name) ?? tabs[0];
        const focused = state.index === index;
        const badgeCount =
          tab.name === 'alerts' ? alertUnread : tab.name === 'inbox' ? inboxUnread : 0;

        return (
          <Pressable
            key={route.key}
            style={[styles.tab, focused && styles.tabActive]}
            onPress={() => navigation.navigate(route.name)}>
            <View style={styles.iconWrap}>
              <Text style={[styles.icon, focused && styles.iconActive]}>{tab.icon}</Text>
              {badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                </View>
              ) : null}
            </View>
            {focused && <View style={styles.pip} />}
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: 6,
    paddingHorizontal: 2,
    minHeight: 72,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    minWidth: 58,
    flex: 1,
  },
  tabActive: {},
  iconWrap: { position: 'relative' },
  icon: {
    fontSize: 20,
  },
  iconActive: {
    transform: [{ scale: 1.08 }],
  },
  pip: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    color: Colors.light,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: Colors.forest,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 9,
    color: Colors.white,
  },
});
