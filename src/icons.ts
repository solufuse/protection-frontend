
import {
  // General
  Loader, User, LogOut, Settings, FileText, Search, Menu, X,
  ChevronRight, ChevronDown, ChevronLeft, ChevronUp,
  ExternalLink, Plus, Trash, Trash2, Edit, Save, Download, Upload,
  Check, CheckCircle, AlertTriangle, AlertCircle, Info, HelpCircle,
  
  // Navigation & Modules
  Folder, HardDrive, Activity, Shield, ShieldCheck, Zap,
  
  // Files
  File, FileJson, FileSpreadsheet, Archive, UploadCloud, RefreshCw,
  ArrowRight, ArrowUpDown, Calendar, Eye, EyeOff,
  
  // Auth & Security
  Key, Lock, Unlock, Crown,
  
  // Misc
  SlidersHorizontal, Filter, XCircle, TrendingUp, Clock, FileSignature
} from 'lucide-react';

export const Icons = {
  // Generic
  Loader, User, LogOut, Settings, FileText, Search, Menu, X,
  ChevronRight, ChevronDown, ChevronLeft, ChevronUp,
  ExternalLink, Plus, Trash, Trash2, Edit, Save, Download, Upload,
  Check, CheckCircle, AlertTriangle, AlertCircle, Info, HelpCircle,
  
  // App Specific
  Folder, HardDrive, Activity, Shield, ShieldCheck, Zap,
  
  // Files specific maps (pour compatibilité avec Files.tsx existant)
  Refresh: RefreshCw,
  Alert: AlertTriangle,
  FileDown: Download,
  Hide: EyeOff,
  Show: Eye,
  
  // File Types
  File, FileJson, FileSpreadsheet, Archive, UploadCloud,
  ArrowRight, ArrowUpDown, Calendar,
  
  // Security
  Key, Lock, Unlock, Crown,
  
  // Dashboard / Loadflow
  SlidersHorizontal, Filter, XCircle, TrendingUp, Clock, FileSignature
};
