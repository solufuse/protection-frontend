
import * as Lucide from 'lucide-react';

export const Icons = {
  ...Lucide, // <--- Importe TOUTES les icônes (Play, Pause, Wifi, etc.)
  
  // Tes Alias personnalisés (pour compatibilité avec le reste du code)
  Refresh: Lucide.RefreshCw,
  Alert: Lucide.AlertTriangle,
  Show: Lucide.Eye,
  Hide: Lucide.EyeOff,
  
  // Note: Trash2, CheckCircle, etc. sont déjà dans ...Lucide
};
