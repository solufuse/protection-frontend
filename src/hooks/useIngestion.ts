import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { localDB } from '../db';

interface SmartConfig {
  processed: boolean;
  source_type: string;
  is_large_file: boolean;
  storage_path: string | null;
  raw_data: any | null;
  created_at: any;
}

export const useIngestion = (userId: string | undefined | null) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!userId) {
      setError("Utilisateur non connecté.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep('starting');

    try {
      // 1. UPLOAD (Vers Firebase Storage)
      setStep('uploading');
      const storageRef = ref(storage, `uploads/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. TRIGGER API (Vers Backend Python)
      setStep('processing');
      const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
      
      const response = await fetch(`${API_URL}/ingestion/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          file_url: downloadURL,
          file_type: file.name.split('.').pop() || 'unknown'
        })
      });

      if (!response.ok) throw new Error("Erreur Backend: " + response.statusText);

      // 3. LISTEN (Attente du résultat dans Firestore)
      console.log("👂 Waiting for Firestore result...");
      const q = query(
        collection(db, "users", userId, "configurations"),
        orderBy("created_at", "desc"),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) return;
        
        const change = snapshot.docChanges()[0];
        // On vérifie que c'est bien le fichier qu'on vient d'envoyer (créé maintenant)
        if (change && change.type === 'added') {
          const config = change.doc.data() as SmartConfig;
          if (!config.processed) return;

          setStep('downloading');
          let finalData = null;

          // 4. SMART RETRIEVAL (Récupération JSON)
          if (config.is_large_file && config.storage_path) {
            const jsonRef = ref(storage, config.storage_path);
            const jsonUrl = await getDownloadURL(jsonRef);
            const res = await fetch(jsonUrl);
            finalData = await res.json();
          } else {
            finalData = config.raw_data;
          }

          // 5. SAVE LOCAL (Dexie Cache)
          setStep('saving');
          try {
              await localDB.files.add({
                userId: userId,
                firestoreId: change.doc.id,
                fileName: file.name,
                fileType: config.source_type,
                data: finalData,
                importedAt: new Date()
              });
          } catch(e) { console.warn("Dexie save failed", e); }

          setStep('done');
          setLoading(false);
          unsubscribe();
        }
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setLoading(false);
      setStep('error');
    }
  };

  return { processFile, loading, step, error };
};
