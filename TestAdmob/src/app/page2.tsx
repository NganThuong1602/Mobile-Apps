import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBannerAd, useAdMobInterstitial } from '@/components/admob-ads';

export default function PageTwoScreen() {
  const { showInterstitial, InterstitialFallbackModal } = useAdMobInterstitial();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.pageLabel}>TRANG</Text>
          <Text style={styles.numberText}>2</Text>

          <Pressable
            style={({ pressed }) => [styles.interstitialButton, pressed && styles.buttonPressed]}
            onPress={() => showInterstitial()}>
            <Text style={styles.interstitialButtonText}>Hiện Interstitial Ads</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại Trang 1</Text>
          </Pressable>
        </View>

        {/* Quảng cáo AdMob Banner cố định ở dưới cùng của Trang 2 */}
        <BottomBannerAd />
      </View>

      <InterstitialFallbackModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pageLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 2,
  },
  numberText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#16a34a',
    marginVertical: 12,
  },
  interstitialButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  interstitialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

