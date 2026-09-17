// @ts-check
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { normalizeAppearance } from '@/lib/appearance';

const STORAGE_KEY = 'boiler_transport_preferences';
const LEGACY_PREFERENCE_KEYS = [
  'boiler_transport_preferences:demo:demo-user',
  'boiler_transport_preferences:live:guest-user',
];

/**
 * @typedef {Object} UserPreferences
 * @property {string[]} favorite_routes
 * @property {string[]} favorite_lots
 * @property {boolean} notifications_enabled
 * @property {boolean} event_alerts
 * @property {boolean} bus_delay_alerts
 * @property {string} default_permit
 * @property {string} appearance
 *
 * @typedef {Object} PreferenceMutation
 * @property {Partial<UserPreferences>} patch
 * @property {string | null=} successMessage
 */

/** @type {UserPreferences} */
const DEFAULT_PREFERENCES = Object.freeze({
  favorite_routes: [],
  favorite_lots: [],
  notifications_enabled: true,
  event_alerts: true,
  bus_delay_alerts: true,
  default_permit: '',
  appearance: 'system',
});

/** @param {unknown} value @returns {string[]} */
const toStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

/** @param {unknown} value @returns {UserPreferences} */
const normalizePreferences = (value) => {
  const saved = /** @type {Partial<UserPreferences>} */ (
    value && typeof value === 'object' ? value : {}
  );
  return {
    favorite_routes: toStringArray(saved.favorite_routes),
    favorite_lots: toStringArray(saved.favorite_lots),
    notifications_enabled:
      typeof saved.notifications_enabled === 'boolean'
        ? saved.notifications_enabled
        : DEFAULT_PREFERENCES.notifications_enabled,
    event_alerts:
      typeof saved.event_alerts === 'boolean'
        ? saved.event_alerts
        : DEFAULT_PREFERENCES.event_alerts,
    bus_delay_alerts:
      typeof saved.bus_delay_alerts === 'boolean'
        ? saved.bus_delay_alerts
        : DEFAULT_PREFERENCES.bus_delay_alerts,
    default_permit: typeof saved.default_permit === 'string' ? saved.default_permit : '',
    appearance: normalizeAppearance(saved.appearance),
  };
};

const removeLegacyBase44Storage = () => {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (
        key === 'token' ||
        key?.startsWith('base44_') ||
        key?.startsWith('boiler_transport_cache:')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Local preferences still work when legacy cleanup is blocked by the browser.
  }
};

/** @returns {UserPreferences} */
const readLocalPreferences = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };

  removeLegacyBase44Storage();

  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    /** @type {string | null} */
    let migratedFrom = null;

    if (!raw) {
      migratedFrom = LEGACY_PREFERENCE_KEYS.find((key) => window.localStorage.getItem(key)) || null;
      raw = migratedFrom ? window.localStorage.getItem(migratedFrom) : null;
    }

    const preferences = normalizePreferences(raw ? JSON.parse(raw) : null);
    if (migratedFrom) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
    LEGACY_PREFERENCE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    return preferences;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

/** @param {UserPreferences} preferences @returns {UserPreferences} */
const writeLocalPreferences = (preferences) => {
  const normalized = normalizePreferences(preferences);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const usePreferences = () => {
  const queryClient = useQueryClient();
  const queryKey = ['preferences', STORAGE_KEY];

  const preferencesQuery = useQuery({
    queryKey,
    queryFn: readLocalPreferences,
    initialData: readLocalPreferences,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const updateMutation = useMutation({
    scope: { id: 'preferences:local' },
    /** @param {PreferenceMutation} mutation */
    mutationFn: async ({ patch }) => {
      const cached = /** @type {UserPreferences | undefined} */ (
        queryClient.getQueryData(queryKey)
      );
      return writeLocalPreferences({
        ...(cached || preferencesQuery.data || DEFAULT_PREFERENCES),
        ...patch,
      });
    },
    /** @param {PreferenceMutation} mutation */
    onMutate: async ({ patch }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = /** @type {UserPreferences | undefined} */ (
        queryClient.getQueryData(queryKey)
      );
      queryClient.setQueryData(queryKey, (current = DEFAULT_PREFERENCES) => ({
        ...normalizePreferences(current),
        ...patch,
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Your changes could not be saved');
    },
    onSuccess: (saved, { successMessage }) => {
      queryClient.setQueryData(queryKey, saved);
      if (successMessage) toast.success(successMessage);
    },
  });

  /** @param {Partial<UserPreferences>} patch @param {string=} successMessage */
  const updatePreferences = (patch, successMessage = 'Settings saved') => {
    updateMutation.mutate({ patch, successMessage });
  };

  /** @param {'favorite_routes' | 'favorite_lots'} field @param {string} itemId */
  const toggleFavorite = (field, itemId) => {
    const cached = /** @type {UserPreferences | undefined} */ (queryClient.getQueryData(queryKey));
    const current = cached || preferencesQuery.data || DEFAULT_PREFERENCES;
    const currentItems = current[field] || [];
    const nextItems = currentItems.includes(itemId)
      ? currentItems.filter((id) => id !== itemId)
      : [...currentItems, itemId];
    updateMutation.mutate({ patch: { [field]: nextItems }, successMessage: null });
  };

  const removePreferences = async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    LEGACY_PREFERENCE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    queryClient.setQueryData(queryKey, { ...DEFAULT_PREFERENCES });
    toast.success('Saved Boiler Transport data removed');
  };

  return {
    preferences: preferencesQuery.data || DEFAULT_PREFERENCES,
    isLoadingPreferences: preferencesQuery.isLoading,
    preferencesError: preferencesQuery.error,
    isSavingPreferences: updateMutation.isPending,
    usesLocalStorage: true,
    updatePreferences,
    toggleFavorite,
    removePreferences,
  };
};
