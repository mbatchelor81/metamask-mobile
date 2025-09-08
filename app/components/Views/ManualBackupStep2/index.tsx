import React, { useEffect, useState, useCallback } from 'react';
import {
  InteractionManager,
  Alert,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import OnboardingProgress from '../../UI/OnboardingProgress';
import ActionView from '../../UI/ActionView';
import { ScreenshotDeterrent } from '../../UI/ScreenshotDeterrent';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import { seedphraseBackedUp } from '../../../actions/user';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getOnboardingNavbarOptions } from '../../UI/Navbar';
import { shuffle, compareMnemonics } from '../../../util/mnemonic';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useTheme } from '../../../util/theme';
import createStyles from './styles';
import { ManualBackUpStepsSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ManualBackUpSteps.selectors';
import trackOnboarding from '../../../util/metrics/TrackOnboarding/trackOnboarding';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';

interface ConfirmedWord {
  word: string | undefined;
  originalPosition: number | undefined;
}

interface WordDict {
  [key: string]: {
    currentPosition: number | undefined;
  };
}

interface ManualBackupStep2Props {
  navigation?: NavigationProp<Record<string, object | undefined>>; 
  seedphraseBackedUp?: () => void;
  route?: {
    params?: {
      words?: string[];
      steps?: string[];
    };
  };
}

const ManualBackupStep2 = ({ navigation, seedphraseBackedUp: seedphraseBackedUpAction, route }: ManualBackupStep2Props) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [confirmedWords, setConfirmedWords] = useState<ConfirmedWord[]>([]);
  const [wordsDict, setWordsDict] = useState<WordDict>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [seedPhraseReady, setSeedPhraseReady] = useState<boolean>(false);

  const currentStep: number = 2;
  const words: string[] | undefined =
    process.env.JEST_WORKER_ID === undefined
      ? shuffle(route?.params?.words || [])
      : route?.params?.words;

  const createWordsDictionary = (): void => {
    const dict: WordDict = {};
    words?.forEach((word: string, i: number) => {
      dict[`${word},${i}`] = { currentPosition: undefined };
    });
    setWordsDict(dict);
  };

  const updateNavBar = useCallback((): void => {
    navigation?.setOptions(getOnboardingNavbarOptions(route, { headerLeft: undefined }, colors));
  }, [colors, navigation, route]);

  useEffect(() => {
    const wordsFromRoute: string[] = route?.params?.words ?? [];
    setConfirmedWords(
      new Array(wordsFromRoute.length).fill({
        word: undefined,
        originalPosition: undefined,
      }) as ConfirmedWord[],
    );
    createWordsDictionary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateNavBar();
  }, [updateNavBar]);

  const findNextAvailableIndex = useCallback(
    (): number => confirmedWords.findIndex(({ word }) => !word),
    [confirmedWords],
  );

  const selectWord = useCallback(
    (word: string, i: number) => {
      let tempCurrentIndex: number = currentIndex;
      const tempWordsDict: WordDict = wordsDict;
      const tempConfirmedWords: ConfirmedWord[] = confirmedWords;
      if (wordsDict[`${word},${i}`].currentPosition !== undefined) {
        tempCurrentIndex = wordsDict[`${word},${i}`].currentPosition as number;
        tempWordsDict[`${word},${i}`].currentPosition = undefined;
        tempConfirmedWords[currentIndex] = {
          word: undefined,
          originalPosition: undefined,
        };
      } else {
        tempWordsDict[`${word},${i}`].currentPosition = currentIndex;
        tempConfirmedWords[currentIndex] = { word, originalPosition: i };
        tempCurrentIndex = findNextAvailableIndex();
      }

      setCurrentIndex(tempCurrentIndex);
      setWordsDict(tempWordsDict);
      setConfirmedWords(tempConfirmedWords);
      setSeedPhraseReady(findNextAvailableIndex() === -1);
    },
    [confirmedWords, currentIndex, findNextAvailableIndex, wordsDict],
  );

  const clearConfirmedWordAt = (i: number): void => {
    const { word, originalPosition } = confirmedWords[i];
    const targetIndex: number = i;
    if (word && (originalPosition || originalPosition === 0)) {
      wordsDict[`${word},${originalPosition}`].currentPosition = undefined;
      confirmedWords[i] = { word: undefined, originalPosition: undefined };
    }

    setCurrentIndex(targetIndex);
    setWordsDict(wordsDict);
    setConfirmedWords(confirmedWords);
    setSeedPhraseReady(findNextAvailableIndex() === -1);
  };

  const validateWords = useCallback((): boolean => {
    const validWords: string[] = route?.params?.words ?? [];
    const proposedWords: (string | undefined)[] = confirmedWords.map(
      (confirmedWord) => confirmedWord.word,
    );

    return compareMnemonics(validWords, proposedWords as string[]);
  }, [confirmedWords, route?.params?.words]);

  const goNext = (): void => {
    if (validateWords()) {
      seedphraseBackedUpAction?.();
      InteractionManager.runAfterInteractions(async () => {
        const routeWords: string[] | undefined = route?.params?.words;
        navigation?.navigate('ManualBackupStep3', {
          steps: route?.params?.steps,
          words: routeWords,
        });
        trackOnboarding(
          MetricsEventBuilder.createEventBuilder(
            MetaMetricsEvents.WALLET_SECURITY_PHRASE_CONFIRMED,
          ).build(),
        );
      });
    } else {
      Alert.alert(
        strings('account_backup_step_5.error_title'),
        strings('account_backup_step_5.error_message'),
      );
    }
  };

  const renderSuccess = (): JSX.Element => {
    const successStyles = createStyles(colors);

    return (
      <View style={successStyles.successRow}>
        <MaterialIcon
          name="check-circle"
          size={15}
          color={colors.success.default}
        />
        <Text style={successStyles.successText}>
          {strings('manual_backup_step_2.success')}
        </Text>
      </View>
    );
  };

  const renderWordBox = (word: string | undefined, i: number): JSX.Element => {
    const wordBoxStyles = createStyles(colors);

    return (
      <View key={`word_${i}`} style={wordBoxStyles.wordBoxWrapper}>
        <Text style={wordBoxStyles.wordBoxIndex}>{i + 1}.</Text>
        <TouchableOpacity
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => {
            clearConfirmedWordAt(i);
          }}
          style={[
            wordBoxStyles.wordWrapper,
            i === currentIndex && wordBoxStyles.currentWord,
            confirmedWords[i].word && wordBoxStyles.confirmedWord,
          ]}
        >
          <Text style={wordBoxStyles.word}>{word}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWordSelectableBox = useCallback(
    (key: string, i: number): JSX.Element => {
      const [word] = key.split(',');
      const selected: boolean = wordsDict[key].currentPosition !== undefined;
      const selectableStyles = createStyles(colors);

      return (
        <TouchableOpacity
          // eslint-disable-next-line react/jsx-no-bind
          onPress={() => selectWord(word, i)}
          style={[selectableStyles.selectableWord, selected && selectableStyles.selectedWord]}
          key={`selectableWord_${i}`}
        >
          <Text
            style={[
              selectableStyles.selectableWordText,
              selected && selectableStyles.selectedWordText,
            ]}
          >
            {word}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, selectWord, wordsDict],
  );

  const renderWords = useCallback(
    (): JSX.Element => (
      <View style={styles.words}>
        {Object.keys(wordsDict).map((key: string, i: number) =>
          renderWordSelectableBox(key, i),
        )}
      </View>
    ),
    [renderWordSelectableBox, styles.words, wordsDict],
  );

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <View style={styles.onBoardingWrapper}>
        <OnboardingProgress
          currentStep={currentStep}
          steps={route?.params?.steps || []}
        />
      </View>
      <ActionView
        confirmTestID={ManualBackUpStepsSelectorsIDs.CONTINUE_BUTTON}
        confirmText={strings('manual_backup_step_2.complete')}
        onConfirmPress={goNext}
        confirmDisabled={!seedPhraseReady || !validateWords()}
        showCancelButton={false}
        confirmButtonMode={'confirm'}
      >
        <View
          style={styles.wrapper}
          testID={ManualBackUpStepsSelectorsIDs.PROTECT_CONTAINER}
        >
          <Text style={styles.action}>
            {strings('manual_backup_step_2.action')}
          </Text>
          <View style={styles.infoWrapper}>
            <Text style={styles.info}>
              {strings('manual_backup_step_2.info')}
            </Text>
          </View>
          <View
            style={[
              styles.seedPhraseWrapper,
              seedPhraseReady && styles.seedPhraseWrapperError,
              validateWords() && styles.seedPhraseWrapperComplete,
            ]}
          >
            <View style={styles.colLeft}>
              {confirmedWords
                .slice(0, confirmedWords.length / 2)
                .map(({ word }, i) => renderWordBox(word, i))}
            </View>
            <View style={styles.colRight}>
              {confirmedWords
                .slice(-confirmedWords.length / 2)
                .map(({ word }, i) =>
                  renderWordBox(word, i + confirmedWords.length / 2),
                )}
            </View>
          </View>
          {validateWords() ? renderSuccess() : renderWords()}
        </View>
      </ActionView>
      <ScreenshotDeterrent enabled isSRP />
    </SafeAreaView>
  );
};


const mapDispatchToProps = (dispatch: (action: ReturnType<typeof seedphraseBackedUp>) => void) => ({
  seedphraseBackedUp: () => dispatch(seedphraseBackedUp()),
});

export default connect(null, mapDispatchToProps)(ManualBackupStep2);
