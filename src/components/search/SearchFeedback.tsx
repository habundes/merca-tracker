import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Surface } from '@/shared/components/adaptive';
import { useTheme } from '@/shared/context/ThemeContext';

export type SearchFeedbackType = 'error' | 'warning' | 'loading' | 'success' | 'hint';

export interface SearchFeedbackProps {
  type: SearchFeedbackType;
  message: string;
}

const SUCCESS_COLOR = '#34C759';
const WARNING_COLOR = '#FF9500';

type Visual = { icon: React.ComponentProps<typeof Ionicons>['name']; color: string };

function useVisual(type: SearchFeedbackType): Visual {
  const { colors } = useTheme();
  switch (type) {
    case 'error':
      return { icon: 'close-circle-outline', color: colors.danger };
    case 'warning':
      return { icon: 'warning-outline', color: WARNING_COLOR };
    case 'loading':
      return { icon: 'hourglass-outline', color: colors.textMuted };
    case 'success':
      return { icon: 'checkmark-circle-outline', color: SUCCESS_COLOR };
    case 'hint':
    default:
      return { icon: 'information-circle-outline', color: colors.textMuted };
  }
}

export function SearchFeedback({ type, message }: SearchFeedbackProps) {
  const { colors } = useTheme();
  const { icon, color } = useVisual(type);

  return (
    <Surface style={[styles.container, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }]} numberOfLines={2}>
        {message}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
