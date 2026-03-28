import { LogIn, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthWithUserData } from '@/store/auth';
import Button from '../ui/Button';

type AnyRecord = Record<string, unknown>;

type AuthPopupMessage = {
  type: 'B24_AUTH_SUCCESS' | 'B24_AUTH_ERROR';
  userId?: number;
  role?: string;
  message?: string;
};

const stripWrappingQuotes = (value: string) =>
  value.trim().replace(/^["']|["']$/g, '');

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/g, '');

const normalizeOrigin = (origin: string) =>
  origin.replace(/\/$/, '').toLowerCase();

const toOrigin = (urlLike: string): string | null => {
  const clean = stripWrappingQuotes(urlLike);
  if (!clean) {
    return null;
  }

  try {
    return normalizeOrigin(new URL(clean).origin);
  } catch {
    return null;
  }
};

const toRecord = (value: unknown): AnyRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as AnyRecord;
};

const isBitrixOrigin = (origin: string) => {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host.includes('bitrix24');
  } catch {
    return false;
  }
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeErrorMessage = (message: string) =>
  message.trim().toLowerCase().replace(/\s+/g, ' ');

const isPopupCloseMessage = (message?: string) => {
  if (!message) {
    return false;
  }

  const normalized = normalizeErrorMessage(message);

  return (
    normalized.includes('окно авторизации закрыто') ||
    normalized.includes('авторизация закрыта') ||
    normalized.includes('popup was closed') ||
    normalized.includes('popup closed')
  );
};

const normalizeAuthMessageType = (
  rawType: unknown,
  fallbackSuccess: unknown
): AuthPopupMessage['type'] | null => {
  if (rawType === 'B24_AUTH_SUCCESS' || rawType === 'B24_AUTH_ERROR') {
    return rawType;
  }

  if (typeof rawType === 'string') {
    const normalized = rawType.toUpperCase();

    if (
      normalized.includes('SUCCESS') ||
      normalized.includes('AUTHORIZED') ||
      normalized === 'OK'
    ) {
      return 'B24_AUTH_SUCCESS';
    }

    if (
      normalized.includes('ERROR') ||
      normalized.includes('FAIL') ||
      normalized.includes('DENIED')
    ) {
      return 'B24_AUTH_ERROR';
    }
  }

  if (fallbackSuccess === true) {
    return 'B24_AUTH_SUCCESS';
  }

  if (fallbackSuccess === false) {
    return 'B24_AUTH_ERROR';
  }

  return null;
};

const parseAuthMessage = (data: unknown): AuthPopupMessage | null => {
  let payload: unknown = data;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  const root = toRecord(payload);
  if (!root) {
    return null;
  }

  const nested = toRecord(root.data) ?? toRecord(root.payload) ?? root;
  const nestedUser = toRecord(nested.user) ?? toRecord(nested.currentUser);

  const typeRaw =
    root.type ??
    root.event ??
    root.status ??
    nested.type ??
    nested.event ??
    nested.status;

  const normalizedType = normalizeAuthMessageType(typeRaw, nested.success);
  if (!normalizedType) {
    return null;
  }

  const userId =
    toNumberOrUndefined(nested.userId) ??
    toNumberOrUndefined(nested.userID) ??
    toNumberOrUndefined(nested.user_id) ??
    toNumberOrUndefined(nested.id) ??
    toNumberOrUndefined(root.userId) ??
    toNumberOrUndefined(root.userID) ??
    toNumberOrUndefined(root.user_id) ??
    toNumberOrUndefined(nestedUser?.id) ??
    toNumberOrUndefined(nestedUser?.ID) ??
    toNumberOrUndefined(nestedUser?.userId) ??
    toNumberOrUndefined(nestedUser?.user_id);

  const roleRaw = nested.role ?? nestedUser?.role;
  const messageRaw = nested.message ?? nested.error;

  return {
    type: normalizedType,
    userId,
    role: typeof roleRaw === 'string' ? roleRaw : undefined,
    message: typeof messageRaw === 'string' ? messageRaw : undefined,
  };
};

type AuthProbeUser = {
  userId: number;
  role?: string;
};

const parseAuthProbeUser = (payload: unknown): AuthProbeUser | null => {
  const root = toRecord(payload);
  if (!root) {
    return null;
  }

  const resultArray = Array.isArray(root.result)
    ? root.result.map(toRecord).filter((v): v is AnyRecord => Boolean(v))
    : [];

  const dataArray = Array.isArray(root.data)
    ? root.data.map(toRecord).filter((v): v is AnyRecord => Boolean(v))
    : [];

  const candidates = [
    root,
    toRecord(root.data),
    toRecord(root.result),
    toRecord(root.user),
    toRecord(root.currentUser),
    ...resultArray,
    ...dataArray,
  ].filter((v): v is AnyRecord => Boolean(v));

  for (const candidate of candidates) {
    const userId =
      toNumberOrUndefined(candidate.userId) ??
      toNumberOrUndefined(candidate.userID) ??
      toNumberOrUndefined(candidate.user_id) ??
      toNumberOrUndefined(candidate.id) ??
      toNumberOrUndefined(candidate.ID);

    if (typeof userId === 'number') {
      const roleRaw = candidate.role ?? candidate.ROLE ?? candidate.userRole;
      return {
        userId,
        role: typeof roleRaw === 'string' ? roleRaw : undefined,
      };
    }
  }

  return null;
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { setAuth } = useAuthWithUserData();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const apiBase = stripWrappingQuotes(import.meta.env.VITE_API_BASE || '');
  const apiPrefix = trimSlashes(
    stripWrappingQuotes(import.meta.env.VITE_API_PREFIX || '')
  );
  const frontendUrl = stripWrappingQuotes(
    import.meta.env.VITE_FRONTEND_URL || window.location.origin
  );

  const apiOrigin = toOrigin(apiBase);
  const frontendOrigin = toOrigin(frontendUrl);
  const currentOrigin = normalizeOrigin(window.location.origin);

  const authUrl = useMemo(() => {
    const cleanBase = trimTrailingSlashes(apiBase);

    if (cleanBase) {
      return apiPrefix
        ? `${cleanBase}/${apiPrefix}/auth/login`
        : `${cleanBase}/auth/login`;
    }

    if (import.meta.env.DEV && apiPrefix) {
      return `/${apiPrefix}/auth/login`;
    }

    return '/auth/login';
  }, [apiBase, apiPrefix]);

  const apiRoot = useMemo(() => {
    const cleanBase = trimTrailingSlashes(apiBase);
    if (cleanBase) {
      return apiPrefix ? `${cleanBase}/${apiPrefix}` : cleanBase;
    }

    if (import.meta.env.DEV && apiPrefix) {
      return `/${apiPrefix}`;
    }

    return apiPrefix ? `/${apiPrefix}` : '';
  }, [apiBase, apiPrefix]);

  const buildApiUrl = useCallback(
    (path: string) => {
      if (/^https?:\/\//i.test(path)) {
        return path;
      }

      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      if (!apiRoot) {
        return normalizedPath;
      }

      return `${trimTrailingSlashes(apiRoot)}${normalizedPath}`;
    },
    [apiRoot]
  );

  const popupRef = useRef<Window | null>(null);
  const watcherRef = useRef<number | null>(null);
  const messageReceivedRef = useRef(false);
  const loadingRef = useRef(false);

  const stopWatcher = useCallback(() => {
    if (watcherRef.current !== null) {
      window.clearInterval(watcherRef.current);
      watcherRef.current = null;
    }
  }, []);

  const finishFlow = useCallback((withError: boolean) => {
    setLoading(false);
    setError(withError);
    loadingRef.current = false;
  }, []);

  const tryResolveAuthWithoutMessage = useCallback(async () => {
    const probePaths = ['/users/me', '/users/current'];

    for (const probePath of probePaths) {
      try {
        const response = await fetch(buildApiUrl(probePath), {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          continue;
        }

        const text = await response.text();
        if (!text) {
          continue;
        }

        let payload: unknown = null;
        try {
          payload = JSON.parse(text);
        } catch {
          continue;
        }

        const resolvedUser = parseAuthProbeUser(payload);
        if (!resolvedUser) {
          continue;
        }

        setAuth(resolvedUser.userId, 'admin');
        finishFlow(false);
        toast.success('Успешный вход через Bitrix24');
        navigate(from, { replace: true });
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }, [buildApiUrl, finishFlow, from, navigate, setAuth]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!loadingRef.current) {
        return;
      }

      const eventOrigin = normalizeOrigin(event.origin || '');
      const allowedOrigins = [currentOrigin, apiOrigin, frontendOrigin].filter(
        (origin): origin is string => Boolean(origin)
      );

      const isTrustedOrigin =
        allowedOrigins.includes(eventOrigin) || isBitrixOrigin(eventOrigin);

      if (!isTrustedOrigin) {
        return;
      }

      const payload = parseAuthMessage(event.data);
      if (!payload) {
        return;
      }

      messageReceivedRef.current = true;
      stopWatcher();

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;

      window.removeEventListener('message', handleMessage);

      if (payload.type === 'B24_AUTH_SUCCESS') {
        if (typeof payload.userId !== 'number') {
          if (isPopupCloseMessage(payload.message)) {
            finishFlow(false);
            return;
          }

          finishFlow(true);
          toast.error('Не удалось получить данные пользователя после авторизации');
          return;
        }

        setAuth(payload.userId, 'admin');
        finishFlow(false);
        toast.success('Успешный вход через Bitrix24');
        navigate(from, { replace: true });
        return;
      }

      if (isPopupCloseMessage(payload.message)) {
        finishFlow(false);
        return;
      }

      finishFlow(true);
      toast.error(payload.message || 'Ошибка авторизации через Bitrix24');
    },
    [
      apiOrigin,
      currentOrigin,
      finishFlow,
      frontendOrigin,
      from,
      navigate,
      setAuth,
      stopWatcher,
    ]
  );

  const startAuth = useCallback(() => {
    if (loadingRef.current) {
      return;
    }

    window.removeEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    setLoading(true);
    setError(false);
    loadingRef.current = true;
    messageReceivedRef.current = false;

    const width = 620;
    const height = 760;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    const authRequestUrl = new URL(authUrl, window.location.origin);
    authRequestUrl.searchParams.set(
      'nonce',
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    const popup = window.open(
      authRequestUrl.toString(),
      'bitrix24-auth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    popupRef.current = popup;

    if (!popup) {
      finishFlow(true);
      toast.error('Разрешите всплывающие окна для этого сайта');
      window.removeEventListener('message', handleMessage);
      return;
    }

    stopWatcher();
    watcherRef.current = window.setInterval(() => {
      const isClosed = !popup || popup.closed;
      if (!isClosed) {
        return;
      }

      stopWatcher();
      popupRef.current = null;

      window.setTimeout(() => {
        void (async () => {
          if (!messageReceivedRef.current && loadingRef.current) {
            const restored = await tryResolveAuthWithoutMessage();
            if (!restored) {
              finishFlow(false);
            }
            window.removeEventListener('message', handleMessage);
          }
        })();
      }, 2500);
    }, 400);
  }, [
    authUrl,
    finishFlow,
    handleMessage,
    stopWatcher,
    tryResolveAuthWithoutMessage,
  ]);

  useEffect(() => {
    return () => {
      stopWatcher();

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }

      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage, stopWatcher]);

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Вход в систему</h1>
            <p className="text-gray-600">
              Для доступа к системе требуется авторизация через Bitrix24
            </p>
          </div>

          {!loading && !error && (
            <Button
              onClick={startAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
            >
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Войти через Bitrix24
              </>
            </Button>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg font-medium">Авторизация через Bitrix24...</span>
              </div>
              <p className="text-sm text-gray-600">
                Пожалуйста, завершите авторизацию в открывшемся окне
              </p>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <Button
                onClick={startAuth}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Попробовать снова
              </Button>

              <div className="text-xs text-gray-500">
                <p className="mb-2">Если проблема повторяется:</p>
                <ul className="space-y-1 text-left">
                  <li>• Проверьте блокировку всплывающих окон</li>
                  <li>• Убедитесь, что у вас есть доступ к Bitrix24</li>
                  <li>• Попробуйте обновить страницу</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && !error && (
            <p className="text-xs text-gray-500 mt-4">
              После нажатия кнопки откроется окно авторизации Bitrix24
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

