import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/styles/theme';
import { Star } from 'lucide-react-native';

export default function RatingScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleRatingPress = (rate: number) => {
    setRating(rate);
  };

  const handleSubmitRating = () => {
    // TODO: Implement logic to submit the rating and comment
    console.log('Submitting rating:', rating, 'comment:', comment);
    // Navigate back to the main rides screen or home screen after submitting
    router.push('/driver/rides');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Rate Passenger</Text>

        <View style={styles.starsContainer}>
          {[...Array(5)].map((_, index) => {
            const starNumber = index + 1;
            return (
              <TouchableOpacity key={index} onPress={() => handleRatingPress(starNumber)}>
                <Star
                  size={40}
                  color={colors.primary.main}
                  fill={starNumber <= rating ? colors.primary.main : colors.background.paper}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment (optional)"
          placeholderTextColor={colors.text.secondary}
          multiline
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  content: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  commentInput: {
    width: '100%',
    height: 100,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xl,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    textAlignVertical: 'top', // For Android to make placeholder start at top
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary.contrastText,
  },
});
