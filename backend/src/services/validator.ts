export const validateProjectFiles = (
  files: Record<string, string>
) => {

  const validated = { ...files }

  // Ensure App.js exists
  if (!validated["App.js"]) {
    validated["App.js"] = `
import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>Hello from Prompt2App 🚀</Text>
    </View>
  );
}
`
  }

  // Ensure package.json exists
  if (!validated["package.json"]) {
    validated["package.json"] = JSON.stringify(
      {
        name: "prompt2app-project",
        version: "1.0.0",
        private: true,
        main: "node_modules/expo/AppEntry.js",
        scripts: {
          start: "expo start"
        },
        dependencies: {
          expo: "~54.0.33",
          react: "19.1.0",
          "react-native": "0.81.5"
        },
        devDependencies: {
          "@types/react": "~19.1.0"
        }
      },
      null,
      2
    )
  }

  return validated
}
