import { useEffect, useState } from 'react';

interface KeyboardState {
  isVisible: boolean;
  height: number;
  visualViewportHeight: number;
}

export function useKeyboardVisibility(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    visualViewportHeight: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined' || !window.visualViewport) {
        return;
      }

      const visualViewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const keyboardHeight = windowHeight - viewportHeight;

      // Keyboard is considered visible if viewport height is significantly less than window height
      const isKeyboardVisible = keyboardHeight > 100; // 100px threshold to avoid false positives

      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: isKeyboardVisible ? keyboardHeight : 0,
        visualViewportHeight: viewportHeight,
      });
    };

    // Check if visualViewport is supported
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);

      // Initial check
      handleResize();

      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('scroll', handleResize);
      };
    }

    // Fallback for browsers without visualViewport support
    let previousHeight = window.innerHeight;

    const fallbackResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = previousHeight - currentHeight;

      setKeyboardState({
        isVisible: heightDiff > 100,
        height: heightDiff > 100 ? heightDiff : 0,
        visualViewportHeight: currentHeight,
      });
    };

    window.addEventListener('resize', fallbackResize);
    return () => window.removeEventListener('resize', fallbackResize);
  }, []);

  return keyboardState;
}
