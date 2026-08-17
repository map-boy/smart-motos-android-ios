import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Star, ThumbsUp, MessageCircle, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { StatusBar } from 'expo-status-bar';

const DRIVER = {
  name: 'John Doe',
  avatar: 'https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=100',
  rating: '4.9',
  trips: '238',
};

export default function RatingScreen() {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = [
    'Great Service',
    'Clean Vehicle',
    'Safe Driver',
    'On Time',
    'Friendly',
    'Professional',
  ];

  const handleTagPress = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    // Here you would typically send the rating data to your backend
    router.push('/(tabs)/book');
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => setRating(star)}
        style={styles.starButton}
        activeOpacity={0.7}
      >
        <Star
          size={40}
          color={star <= rating ? Colors.primary.default : Colors.neutral.light}
          fill={star <= rating ? Colors.primary.default : 'none'}
          strokeWidth={1.5}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.secondary.default} />
          </TouchableOpacity>
          <Text style={styles.title}>Rate Ride</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.driverCard}>
            <Image source={{ uri: DRIVER.avatar }} style={styles.driverAvatar} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{DRIVER.name}</Text>
              <View style={styles.driverStats}>
                <Star size={12} color={Colors.primary.default} fill={Colors.primary.default} />
                <Text style={styles.statText}>{DRIVER.rating}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingPrompt}>How was your trip?</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingFeedback}>
                {rating === 5 ? 'Excellent!' : 
                 rating === 4 ? 'Great!' : 
                 rating === 3 ? 'Good' : 
                 rating === 2 ? 'Fair' : 'Poor'}
              </Text>
            )}
          </View>

          {rating > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>
                What went well?
                
              </Text>
              <View style={styles.tagsList}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.selectedTag,
                    ]}
                    onPress={() => handleTagPress(tag)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.selectedTagText,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {rating > 0 && (
            <TouchableOpacity style={styles.commentButton}>
              <MessageCircle size={16} color={Colors.primary.default} />
              <Text style={styles.commentButtonText}>Add a comment</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={rating > 0 ? "Submit" : "Skip"}
            onPress={handleSubmit}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Platform.OS === 'android' ? 40 : Layout.spacing.m,
    paddingBottom: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lighter,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary.default,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.xl,
    marginVertical: Layout.spacing.l,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary.light,
  },
  driverInfo: {
    marginLeft: Layout.spacing.m,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary.default,
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.neutral.dark,
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: Layout.spacing.l,
    paddingHorizontal: Layout.spacing.xl,
  },
  ratingPrompt: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.l,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: Layout.spacing.xs,
  },
  ratingFeedback: {
    marginTop: Layout.spacing.m,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary.default,
  },
  tagsSection: {
    marginTop: Layout.spacing.m,
    paddingHorizontal: Layout.spacing.xl,
  },
  tagsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.m,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Layout.spacing.xs,
  },
  tag: {
    backgroundColor: Colors.neutral.lighter,
    borderRadius: Layout.borderRadius.l,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    margin: Layout.spacing.xs,
  },
  selectedTag: {
    backgroundColor: Colors.primary.light,
    borderWidth: 1,
    borderColor: Colors.primary.default,
  },
  tagText: {
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  selectedTagText: {
    color: Colors.primary.default,
    fontWeight: '500',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.xl,
    gap: 8,
  },
  commentButtonText: {
    color: Colors.primary.default,
    fontWeight: '500',
  },
  footer: {
    padding: Layout.spacing.l,
    paddingBottom: Platform.OS === 'ios' ? Layout.spacing.l : Layout.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lighter,
    backgroundColor: Colors.neutral.white,
  },
  button: {
    borderRadius: Layout.borderRadius.l,
  },
});