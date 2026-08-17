import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname, Link } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/styles/theme';
import { Chrome as Home, Car, User, LogOut, Star } from 'lucide-react-native';

const PROFILE_IMAGE =
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300';

const menuItems = [
  { icon: Home, label: 'Home', route: 'driver/home' },
  { icon: Car, label: 'Rides', route: 'driver/rides' },
  { icon: User, label: 'Account', route: 'driver/account' },
];

export default function DrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname(); // get the current path

  const handleSignOut = () => {
    router.replace('/driver/auth/login');
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.profileSection}>
        <Image source={{ uri: PROFILE_IMAGE }} style={styles.profileImage} />
        <Text style={styles.name}>Manene Junior</Text>
        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              size={16}
              color={colors.primary.main}
              fill={colors.primary.main}
            />
          ))}
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => {
          const isActive = pathname === item.route;
          return (
            <Link
              key={index}
              href={item.route}
              style={[
                styles.menuItem,
                isActive && styles.activeMenuItem, // if active, apply active style
              ]}
              onPress={() => props.navigation.closeDrawer()}
            >
              <View>
                <item.icon
                  size={24}
                  color={isActive ? colors.primary.main : colors.text.primary}
                />
              </View>

              <View>
                <Text
                  style={[
                    styles.menuItemText,
                    isActive && { color: colors.primary.main },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </Link>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.menuItem, styles.signOutButton]}
        onPress={handleSignOut}
      >
        <LogOut size={24} color={colors.error.main} />
        <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  profileSection: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  name: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuSection: {
    paddingVertical: spacing.lg,
    gap: spacing.md, // only works if you use a View container in RN 0.71+, else manually marginBottom
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm, // spacing between menu items
  },
  activeMenuItem: {
    backgroundColor: colors.primary.light, // highlight active background
  },
  menuItemText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  signOutButton: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  signOutText: {
    color: colors.error.main,
  },
});
