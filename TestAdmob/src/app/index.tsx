import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBannerAd, useAdMobInterstitial } from '@/components/admob-ads';

export default function PageOneScreen() {
  const { showInterstitial, InterstitialFallbackModal } = useAdMobInterstitial();

  const handleClick = () => {
    // Hiển thị quảng cáo Interstitial và chuyển sang Trang 2 sau khi đóng quảng cáo
    showInterstitial(() => {
      router.push('/page2');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.pageLabel}>TRANG</Text>
          <Text style={styles.numberText}>1</Text>

          <Pressable
            style={({ pressed }) => [styles.clickButton, pressed && styles.buttonPressed]}
            onPress={handleClick}>
            <Text style={styles.clickButtonText}>click</Text>
          </Pressable>

          <Text style={styles.hintText}>
            Nhấn nút &quot;click&quot; để gọi Interstitial Ad và chuyển sang Trang 2
          </Text>
        </View>

        {/* Quảng cáo AdMob Banner cố định ở dưới cùng của Trang 1 */}
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
    color: '#0f172a',
    marginVertical: 12,
  },
  clickButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  clickButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  hintText: {
    marginTop: 20,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});
