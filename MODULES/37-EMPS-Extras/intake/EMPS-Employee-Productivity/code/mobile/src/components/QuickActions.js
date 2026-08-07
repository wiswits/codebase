import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const QuickActions = () => {
  const navigation = useNavigation();

  const actions = [
    { label: 'Check In', icon: '✅', screen: 'Attendance' },
    { label: 'Apply Leave', icon: '📅', screen: 'Leave' },
    { label: 'View Tasks', icon: '📋', screen: 'Tasks' },
    { label: 'Chat', icon: '💬', screen: 'Chat' },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.actionButton}
          onPress={() => navigation.navigate(action.screen)}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.iconText}>{action.icon}</Text>
          </View>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  actionButton: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconText: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
});