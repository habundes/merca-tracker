import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ListStackParamList } from '../features/list/presentation/navigation/types';
import type { ProfileStackParamList } from '../features/profile/presentation/navigation/types';

export type AppTabsParamList = {
  Lista: NavigatorScreenParams<ListStackParamList>;
  Buscar: undefined;
  Perfil: NavigatorScreenParams<ProfileStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppTabsParamList {}
  }
}
