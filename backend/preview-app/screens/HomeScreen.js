import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProjectCard from '../components/ProjectCard';
import ThemeContext from '../context/ThemeContext';
import { projects } from '../data/projects';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  
  const handleProjectPress = (project) => {
    navigation.navigate('ProjectDetail', { project });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>John Doe</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Senior Mobile Developer</Text>
        <Text style={[styles.description, { color: theme.text }]}>
          I build exceptional digital experiences that are fast, accessible, visually appealing, and responsive.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Projects</Text>
        {projects.map((project) => (
          <TouchableOpacity 
            key={project.id} 
            onPress={() => handleProjectPress(project)}
          >
            <ProjectCard project={project} />
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills</Text>
        <View style={styles.skillsContainer}>
          {['React Native', 'JavaScript', 'TypeScript', 'UI/UX Design', 'Node.js', 'GraphQL'].map((skill, index) => (
            <View key={index} style={[styles.skillBadge, { backgroundColor: theme.cardBackground }]}> 
              <Text style={[styles.skillText, { color: theme.text }]}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
