import { Alert } from 'react-native';

// Opciones del diálogo de confirmación destructiva. `cancelLabel` es opcional
// (default 'Cancelar').
export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
};

/**
 * Muestra un `Alert.alert` de confirmación para una acción destructiva: un
 * botón `cancel` (no hace nada) y un botón `destructive` que ejecuta
 * `onConfirm`. Patrón compartido por "Limpiar", el borrado individual desde el
 * swipe y el menú contextual "Eliminar del historial" (spec 17).
 */
export function confirmDestructiveAction({
  title,
  message,
  confirmLabel,
  onConfirm,
  cancelLabel = 'Cancelar',
}: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
