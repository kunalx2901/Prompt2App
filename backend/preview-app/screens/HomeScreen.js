import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

export default function HomeScreen({ navigation }) {
  const [flipAnim] = useState(new Animated.Value(0));
  const [isFlipping, setIsFlipping] = useState(false);

  const flipCoin = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    
    Animated.sequence([
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
      setIsFlipping(false);
      navigation.navigate('Result', { result });
    });
  };

  const spin = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coin Toss</Text>
      
      <View style={styles.coinContainer}>
        <Animated.View 
          style={[
            styles.coin, 
            { 
              transform: [{ rotateY: spin }] 
            }
          ]}
        >
          <Text style={styles.coinText}>?</Text>
        </Animated.View>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={flipCoin}
        disabled={isFlipping}
      >
        <Text style={styles.buttonText}>
          {isFlipping ? 'Flipping...' : 'TOSS COIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 50,
  },
  coinContainer: {
    marginBottom: 50,
  },
  coin: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'black',
  },
  coinText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});
