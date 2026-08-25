import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, DynamicColorIOS } from 'react-native';
import { useTheme, lightColors, darkColors } from '@/shared/context/ThemeContext';

// Ruta ancla del navegador de tabs. El landing real lo maneja app/index.tsx
// con un <Redirect href="/search" />.
export const unstable_settings = {
  anchor: 'search',
};

const isIOS = Platform.OS === 'ios';

export default function TabsLayout() {
  const { colors, isHydrated } = useTheme();

  // NativeTabs renderiza la barra nativa: Material 3 en Android (con su pill
  // indicator nativo) y Liquid Glass en iOS 26+.
  // En iOS usamos DynamicColorIOS para que la barra se resuelva a nivel nativo
  // contra el trait de apariencia (que ThemeContext fuerza al modo de la app),
  // evitando el parpadeo a claro al cambiar de tab en modo oscuro.
  // En Android coloreamos con el tema (con fallback pre-hidratación).
  const backgroundColor = isIOS
    ? DynamicColorIOS({ light: lightColors.bgSecondary, dark: darkColors.bgSecondary })
    : isHydrated
      ? colors.surface
      : lightColors.surface;
  // Tab activo con color de texto (blanco en oscuro, casi negro en claro —
  // "blanco" sobre barra oscura, sin desaparecer en modo claro) e inactivo en
  // gris tenue. En iOS via DynamicColorIOS para adaptación nativa sin parpadeo.
  const activeColor = isIOS
    ? DynamicColorIOS({ light: lightColors.text, dark: darkColors.text })
    : isHydrated
      ? colors.text
      : lightColors.text;
  const inactiveColor = isIOS
    ? DynamicColorIOS({ light: lightColors.tabInactive, dark: darkColors.tabInactive })
    : isHydrated
      ? colors.tabInactive
      : lightColors.tabInactive;

  // fontSize solo en Android (iOS conserva el tamaño de label nativo).
  const labelFont = isIOS ? {} : { fontSize: 15 };
  const iconColor = { default: inactiveColor, selected: activeColor };
  const labelStyle = {
    default: { ...labelFont, color: inactiveColor },
    selected: { ...labelFont, color: activeColor },
  };

  return (
    <NativeTabs
      backgroundColor={backgroundColor}
      tintColor={activeColor}
      iconColor={iconColor}
      labelStyle={labelStyle}
      // Sin píldora de indicador en Android (MD3): el color activo lo da tintColor.
      // Evita el lavanda del tema Material por defecto. Ignorado en iOS.
      disableIndicator
    >
      <NativeTabs.Trigger name="track">
        <NativeTabs.Trigger.Icon sf={{ default: 'tray.full', selected: 'tray.full.fill' }} md="inbox" />
        <NativeTabs.Trigger.Label>Mis Rastreos</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
