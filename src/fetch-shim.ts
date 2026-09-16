// Polyfill/Shim to ensure window.fetch can be safely assigned without throwing:
// "TypeError: Cannot set property fetch of #<Window> which has only a getter"
(function () {
  const globalObj =
    typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
      ? globalThis
      : self;

  if (!globalObj) return;

  try {
    const rawFetch = globalObj.fetch;
    let currentFetch = typeof rawFetch === 'function' ? rawFetch.bind(globalObj) : rawFetch;

    // 1. Prototype protection (Window.prototype)
    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        const protoDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
        if (protoDesc && protoDesc.get && !protoDesc.set) {
          Object.defineProperty(Window.prototype, 'fetch', {
            get() {
              return currentFetch;
            },
            set(val) {
              currentFetch = val;
            },
            configurable: true,
            enumerable: true,
          });
        }
      } catch {
        // Ignore if prototype is sealed
      }
    }

    // 2. Window / Global object protection
    try {
      const winDesc = Object.getOwnPropertyDescriptor(globalObj, 'fetch');
      if (!winDesc || (winDesc.get && !winDesc.set) || !winDesc.writable) {
        Object.defineProperty(globalObj, 'fetch', {
          get() {
            return currentFetch;
          },
          set(val) {
            currentFetch = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    } catch {
      // Ignore if non-configurable
    }

    // 3. Intercept future Object.defineProperty calls on fetch
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function (obj: any, prop: PropertyKey, descriptor: PropertyDescriptor) {
      try {
        if (
          (obj === globalObj || (typeof Window !== 'undefined' && obj === Window.prototype)) &&
          prop === 'fetch' &&
          descriptor
        ) {
          if (descriptor.get && !descriptor.set) {
            let storedVal: any;
            const origGet = descriptor.get;
            descriptor.set = function (v: any) {
              storedVal = v;
              currentFetch = v;
            };
            descriptor.get = function () {
              return storedVal !== undefined ? storedVal : origGet.call(this);
            };
          }
        }
      } catch {
        // Fail-safe
      }
      return originalDefineProperty.call(Object, obj, prop, descriptor);
    };
  } catch {
    // Fail-safe
  }
})();

export {};
