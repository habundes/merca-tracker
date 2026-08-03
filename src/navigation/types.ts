import type { NavigatorScreenParams } from '@react-navigation/native';
import type { HomeStackParamList } from '../features/home/presentation/navigation/types';
import type { ProfileStackParamList } from '../features/profile/presentation/navigation/types';

export type AppTabsParamList = {
  Historial: NavigatorScreenParams<HomeStackParamList>;
  Buscar: undefined;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppTabsParamList {}
  }
}
