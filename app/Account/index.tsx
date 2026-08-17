import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Settings, Lock, Share2, CreditCard, MessageCircle, LogOut, ChevronRight, CreditCard as Edit2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useAuth } from '@/hooks/AuthContext';
import * as ImagePicker from 'expo-image-picker';

type MenuItemProps = {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
};

function MenuItem({ icon, title, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>{icon}</View>
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <ChevronRight size={20} color={Colors.neutral.medium} />
    </TouchableOpacity>
  );
}

export default function AccountScreen() {

  const { user, updateProfilePhoto } = useAuth();
  const [showTopUp, setShowTopUp] = useState(false);  
  const [showRefer, setShowRefer] = useState(false);
  const handleLogout = () => {
    router.replace('../../Auth/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>RWF</Text>
            </View>
            <Text style={styles.balanceAmount}>{(user?.walletBalance ?? 0).toLocaleString()}Rwf</Text>
          </View>
          <TouchableOpacity style={styles.topUpButton} onPress={() => router.push('/Account/TopUp')}>
            <Text style={styles.topUpText} >Top up +</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={ user?.photoUrl ? { uri: user.photoUrl } : require('@/assets/images/default-avatar.png') }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={async () => {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.7,
                });
                if (!result.canceled && result.assets[0]) {
                  await updateProfilePhoto(result.assets[0].uri);
                }
              }}
            >
              <Edit2 size={16} color={Colors.primary.default} />
            </TouchableOpacity>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Dedicated</Text>
          </View>
          <Text style={styles.name}>{user?.name || "—"}</Text>
          <Text style={styles.email}>{user?.email || "—"}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon={<Settings size={24} color={Colors.secondary.default} />}
          title="Account settings"
          onPress={() => router.push('/Account/settings')}
        />
        <MenuItem
          icon={<Share2 size={24} color={Colors.secondary.default} />}
          title="Refer a friend"
          onPress={() => setShowRefer(true)}
        />
        <MenuItem
          icon={<CreditCard size={24} color={Colors.secondary.default} />}
          title="Card and bank settings"
          onPress={() => router.push('/Ride/payment')}
        />
        <MenuItem
          icon={<MessageCircle size={24} color={Colors.secondary.default} />}
          title="Customer support"
          onPress={() => router.push('/Support')}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
        <LogOut size={24} color={Colors.error.default} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.default,
  },
  content: {
    paddingBottom: Layout.spacing.xl,
  },
  header: {
    padding: Layout.spacing.xl,
    paddingTop: 60,
  },
  balanceContainer: {
    marginBottom: Layout.spacing.xl,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  currencyBadge: {
    backgroundColor: Colors.secondary.default,
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.s,
    marginRight: Layout.spacing.s,
  },
  currencyText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary.default,
  },
  topUpButton: {
    backgroundColor: Colors.secondary.default,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.m,
    alignSelf: 'flex-start',
  },
  topUpText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Layout.spacing.m,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.neutral.white,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeContainer: {
    backgroundColor: Colors.neutral.lighter,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.m,
    marginBottom: Layout.spacing.s,
  },
  badgeText: {
    color: Colors.secondary.default,
    fontSize: 12,
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.xs,
  },
  email: {
    fontSize: 14,
    color: Colors.secondary.default,
  },
  menuSection: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.l,
    marginHorizontal: Layout.spacing.l,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lighter,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.lightest,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.secondary.default,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.xl,
    marginHorizontal: Layout.spacing.l,
    padding: Layout.spacing.l,
    backgroundColor: Colors.error.light,
    borderRadius: Layout.borderRadius.l,
  },
  signOutText: {
    color: Colors.error.default,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Layout.spacing.s,
  },
});