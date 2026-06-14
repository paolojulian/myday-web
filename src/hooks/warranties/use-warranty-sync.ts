import { useEffect } from "react";
import { warrantySyncService } from "@/services/warranty-service/warranty-sync.service";

/**
 * Drains queued warranty receipt uploads on mount and whenever the device comes
 * back online. Mount this once near the app root.
 */
export const useWarrantySync = () => {
  useEffect(() => {
    void warrantySyncService.drainQueue();

    const handleOnline = () => void warrantySyncService.drainQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
};
