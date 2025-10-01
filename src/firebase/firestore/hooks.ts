'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  type DocumentData,
  type Query,
  type DocumentReference,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, path));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(documents);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, isLoading };
}

export function useDoc<T>(path: string) {
    const firestore = useFirestore();
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(firestore, path);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData({ id: docSnap.id, ...docSnap.data() } as T);
            } else {
                setData(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, path]);

    return { data, isLoading };
}
