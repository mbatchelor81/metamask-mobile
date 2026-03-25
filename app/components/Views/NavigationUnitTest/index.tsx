/**
 * This view was created in order to test the navigation api since it's possible it can change even with minor upgrades.
 * For reference see: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate
 */

/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  NavigationContainer,
  useNavigationState,
} from '@react-navigation/native';
import { findRouteNameFromNavigatorState } from '../../../util/general';
import { Text } from 'react-native';

interface TestScreenProps {
  route: { params: { screenName: string } };
}

interface TestStackProps {
  secondRoute?: string;
}

interface NavigationUnitTestProps {
  firstRoute?: string;
  secondRoute?: string;
}

const Stack = createStackNavigator();

const TestScreen = ({ route }: TestScreenProps): React.JSX.Element => {
  const routes = useNavigationState((state) => state.routes);

  const name = findRouteNameFromNavigatorState(routes);

  if (name !== route.params.screenName)
    throw new Error(
      'Error, react navigation api changed: https://reactnavigation.org/docs/navigation-prop/#dangerouslygetstate',
    );

  return <Text>{name} THIS SHOULD NOT HAVE CHANGED, take a deeper look</Text>;
};

const TestSubStack = (): React.JSX.Element => (
  <Stack.Navigator initialRouteName="TestScreen">
    <Stack.Screen
      name="TestScreen3"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen3' }}
    />
  </Stack.Navigator>
);

const TestStack = ({ secondRoute }: TestStackProps): React.JSX.Element => (
  <Stack.Navigator initialRouteName={secondRoute || 'TestSubStack'}>
    <Stack.Screen name="TestSubStack" component={TestSubStack} />
    <Stack.Screen
      name="TestScreen2"
      component={TestScreen}
      initialParams={{ screenName: 'TestScreen2' }}
    />
  </Stack.Navigator>
);

const NavigationUnitTest = ({ firstRoute, secondRoute }: NavigationUnitTestProps): React.JSX.Element => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName={firstRoute || 'TestStack'}>
      <Stack.Screen name="TestStack" component={TestStack} />
      <Stack.Screen
        name="TestScreen1"
        component={TestScreen}
        initialParams={{ screenName: 'TestScreen1' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const NavigationUnitTestFactory = ({ firstRoute, secondRoute }: NavigationUnitTestProps): React.JSX.Element => (
  <NavigationUnitTest firstRoute={firstRoute} secondRoute={secondRoute} />
);

export default NavigationUnitTestFactory;
