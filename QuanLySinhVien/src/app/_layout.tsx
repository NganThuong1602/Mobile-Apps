import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from '../database/studentDatabase';
import { t } from '../i18n/translations';

export default function RootLayout() {
  const [databaseReady, setDatabaseReady] =
    useState(false);

  useEffect(() => {
    const prepareDatabase = async () => {
      try {
        await initDatabase();
        setDatabaseReady(true);
      } catch (error) {
        console.error(
          'Database initialization error:',
          error
        );
      }
    };

    prepareDatabase();
  }, []);

  if (!databaseReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1976D2',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t('appName'),
          }}
        />

        <Stack.Screen
          name="student/[id]"
          options={{
            title: t('studentDetail'),
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});