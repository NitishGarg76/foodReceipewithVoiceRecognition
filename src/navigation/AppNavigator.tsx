import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ChatbotScreen from '../screens/ChatbotScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
