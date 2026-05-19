import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import ThemeContext from '../context/ThemeContext';

export default function ProjectDetailScreen({ route }) {
  const { project } = route.params;
  const { theme } = useContext(ThemeContext);
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <Image source={{ uri: project.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{project.title}</Text>
        <Text style={[styles.description, { color: theme.text }]}>{project.description}</Text>
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Technologies:</Text>
          <Text style={[styles.detailText, { color: theme.text }]}>{project.technologies.join(', ')}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Role:</Text>
          <Text style={[styles.detailText, { color: theme.text }]}>{project.role}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Duration:</Text>
          <Text style={[styles.detailText, { color: theme.text }]}>{project.duration}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 16,
  },
});
