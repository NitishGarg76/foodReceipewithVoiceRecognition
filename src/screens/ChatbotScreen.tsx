import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions';

const ChatbotScreen = () => {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);
  const onSpeechStartHandler = result => {
    console.log(result);
  };
  const onSpeechEndHandler = result => {
    console.log(result);
  };
  const onSpeechResultsHandler = result => {
    console.log(result,"33333");
    if (result.value && result.value.length > 0) {
      const recognizedText = result.value[0];
      setQuery(recognizedText);
      fetchRecipes(recognizedText);
    }
  };
  const fetchRecipes = async (query: string) => {
    try {
      const response = await axios.get(
        `https://api.spoonacular.com/recipes/complexSearch`,
        {
          params: {
            query,
            apiKey: '7f826cbbc2f44187949f5495c43dd702',
          },
        },
      );
      const recipeDetails = await Promise.all(
        response.data.results.map(async (recipe: any) => {
          const details = await axios.get(
            `https://api.spoonacular.com/recipes/${recipe.id}/information`,
            {
              params: {apiKey: '7f826cbbc2f44187949f5495c43dd702'},
            },
          );
          return details.data;
        }),
      );
      setRecipes(recipeDetails);
      await AsyncStorage.setItem('recipes', JSON.stringify(recipeDetails));
    } catch (err) {
      setError(err.message);
    }
  };

  const onSpeechResults = result => {
    if (result.value && result.value.length > 0) {
      const recognizedText = result.value[0];
      setQuery(recognizedText);
      fetchRecipes(recognizedText);
    }
  };

  const onSpeechError = error => {
    setError(JSON.stringify(error));
  };

  const handleVoiceRecognition = async () => {
    setError(null); // Clear previous errors
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'We need access to your microphone to recognize your voice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Microphone permission denied');
          return;
        }
      } catch (err) {
        setError(err.message);
        return;
      }
    } else if (Platform.OS === 'ios') {
      try {
        const status = await check(PERMISSIONS.IOS.MICROPHONE);
        if (status !== RESULTS.GRANTED) {
          const granted = await request(PERMISSIONS.IOS.MICROPHONE);
          if (granted !== RESULTS.GRANTED) {
            setError('Microphone permission denied');
            return;
          }
        }
      } catch (err) {
        setError(err.message);
        return;
      }
    }
    try {
      await Voice.start('en-US');
    } catch (e) {
      setError(e.message);
    }
  };

  const renderRecipe = ({item}) => (
    <View style={styles.recipeContainer}>
      <Text style={styles.recipeTitle}>{item.title}</Text>
      <Text style={styles.recipeIngredients}>Ingredients:</Text>
      {item.extendedIngredients.map((ingredient: any) => (
        <Text key={ingredient.id}>- {ingredient.original}</Text>
      ))}
      <Text style={styles.recipeInstructions}>Instructions:</Text>
      <Text>{item.instructions}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a recipe name"
        value={query}
        onChangeText={setQuery}
      />
      <View style={{gap: Platform.OS === 'android' ? 10 : 0}}>
        <Button title="Search" onPress={() => fetchRecipes(query)} />
        <Button title="Voice Search" onPress={handleVoiceRecognition} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 8,
    padding: 8,
  },
  recipeContainer: {
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recipeIngredients: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  recipeInstructions: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
  },
});

export default ChatbotScreen;
