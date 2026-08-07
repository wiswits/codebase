import { useState, useEffect, useCallback } from 'react';

interface QueuedOperation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries?: number;
}

interface OfflineQueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSync?: (operation: QueuedOperation) => void;
  onError?: (operation: QueuedOperation, error: Error) => void;
}

export function useOfflineQueue(options: OfflineQueueOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    onSync,
    onError,
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from IndexedDB
  useEffect(() => {
    loadQueueFromDB();
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save queue to IndexedDB whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      saveQueueToDB(queue);
    }
  }, [queue]);

  const loadQueueFromDB = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const loadedQueue = request.result || [];
        setQueue(loadedQueue);
        
        // Auto-sync when app loads and online
        if (navigator.onLine && loadedQueue.length > 0) {
          syncQueue(loadedQueue);
        }
      };
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  const saveQueueToDB = async (queueData: QueuedOperation[]) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      
      // Clear existing
      store.clear();
      
      // Add all items
      queueData.forEach(item => {
        store.add(item);
      });
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HMSOfflineQueue', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('queue')) {
          const store = db.createObjectStore('queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('retries', 'retries');
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const addToQueue = useCallback(async (
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data: any
  ) => {
    const operation: QueuedOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
    };

    setQueue(prev => [...prev, operation]);

    // If online, try to sync immediately
    if (isOnline) {
      await syncOperation(operation);
    }

    return operation.id;
  }, [isOnline, maxRetries]);

  const syncOperation = async (operation: QueuedOperation) => {
    try {
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove from queue on success
      setQueue(prev => prev.filter(item => item.id !== operation.id));
      onSync?.(operation);
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Increment retry count
      const updatedOperation = {
        ...operation,
        retries: operation.retries + 1,
      };
      
      setQueue(prev => 
        prev.map(item => 
          item.id === operation.id ? updatedOperation : item
        )
      );
      
      onError?.(operation, error as Error);
      
      // If max retries exceeded, remove from queue
      if (updatedOperation.retries >= (updatedOperation.maxRetries || maxRetries)) {
        setQueue(prev => prev.filter(item => item.id !== operation.id));
      }
      
      return false;
    }
  };

  const syncQueue = useCallback(async (queueData?: QueuedOperation[]) => {
    const itemsToSync = queueData || queue;
    if (itemsToSync.length === 0 || isSyncing) return;

    setIsSyncing(true);
    
    try {
      // Sort by timestamp (oldest first)
      const sorted = [...itemsToSync].sort((a, b) => a.timestamp - b.timestamp);
      
      for (const operation of sorted) {
        // Skip if already synced or max retries exceeded
        if (operation.retries >= (operation.maxRetries || maxRetries)) {
          setQueue(prev => prev.filter(item => item.id !== operation.id));
          continue;
        }
        
        await syncOperation(operation);
        
        // Add delay between retries
        if (operation.retries > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      console.error('Sync queue failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [queue, isSyncing, maxRetries, retryDelay]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    saveQueueToDB([]);
  }, []);

  const getQueueSize = useCallback(() => {
    return queue.length;
  }, [queue]);

  const getPendingOperations = useCallback(() => {
    return queue;
  }, [queue]);

  return {
    queue,
    isOnline,
    isSyncing,
    addToQueue,
    syncQueue,
    clearQueue,
    getQueueSize,
    getPendingOperations,
  };
}