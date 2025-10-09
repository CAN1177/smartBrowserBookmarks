import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentLanguage, 
  setCurrentLanguage, 
  getCurrentLanguageSync,
  type SupportedLanguage 
} from './index';

/**
 * 语言管理 Hook
 * 提供当前语言状态和切换语言的方法
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<SupportedLanguage>(getCurrentLanguageSync());
  const [loading, setLoading] = useState(false);

  // 初始化语言设置
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const currentLang = await getCurrentLanguage();
        setLanguageState(currentLang);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
      }
    };

    initLanguage();
  }, []);

  // 切换语言
  const changeLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) return;

    setLoading(true);
    try {
      await setCurrentLanguage(newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [language]);

  return {
    language,
    changeLanguage,
    loading
  };
}