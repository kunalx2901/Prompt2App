import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import ThemeContext from '../context/ThemeContext';

export default function ProjectCard({ project }) {
  const { theme } = useContext(ThemeContext);
  
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}> 
      <Image source={{ uri: project.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{project.title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {project.description}
        </Text>
        <View style={styles.tagsContainer}>
          {project.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: theme.tagBackground }]}> 
              <Text style={[styles.tagText, { color: theme.tagText }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
