// src/services/autoTranslateService.ts

class AutoTranslateService {
  private currentLang: string = 'vi';
  private originalTexts: Map<Element, string> = new Map();
  private translationCache: Map<string, Map<string, string>> = new Map();
  private apiUrl = 'https://libretranslate.com/translate';

  /**
   * Dịch một đoạn text
   */
  async translateText(text: string, targetLang: string): Promise<string> {
    if (targetLang === 'vi') return text;

    // Check cache
    const langCache = this.translationCache.get(targetLang) || new Map();
    if (langCache.has(text)) {
      return langCache.get(text)!;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'vi',
          target: targetLang === 'en' ? 'en' : 'ko',
          format: 'text'
        })
      });

      const data = await response.json();
      const translated = data.translatedText || text;

      // Save to cache
      langCache.set(text, translated);
      this.translationCache.set(targetLang, langCache);

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  /**
   * Lưu text gốc của tất cả elements
   */
  private saveOriginalTexts(root: Element = document.body) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Bỏ qua script, style, và text rỗng
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          const text = node.textContent?.trim() || '';
          if (text.length === 0) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement!;
      const text = node.textContent?.trim() || '';
      
      if (!this.originalTexts.has(element)) {
        this.originalTexts.set(element, text);
      }
    }
  }

  /**
   * Dịch toàn bộ trang
   */
  async translatePage(targetLang: string) {
    if (targetLang === this.currentLang) return;

    // Nếu quay về tiếng Việt, restore text gốc
    if (targetLang === 'vi') {
      this.restoreOriginalTexts();
      this.currentLang = 'vi';
      localStorage.setItem('appLanguage', 'vi');
      return;
    }

    // Lưu text gốc nếu chưa có
    if (this.originalTexts.size === 0) {
      this.saveOriginalTexts();
    }

    // Lấy tất cả text nodes
    const elements = this.getAllTextElements();
    
    // Dịch từng batch (20 elements một lúc để tránh quá tải)
    const batchSize = 20;
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (element) => {
          const originalText = this.originalTexts.get(element);
          if (!originalText) return;

          const translated = await this.translateText(originalText, targetLang);
          
          // Update text content
          const textNode = Array.from(element.childNodes).find(
            node => node.nodeType === Node.TEXT_NODE
          );
          
          if (textNode) {
            textNode.textContent = translated;
          }
        })
      );
    }

    this.currentLang = targetLang;
    localStorage.setItem('appLanguage', targetLang);
  }

  /**
   * Lấy tất cả elements có text
   */
  private getAllTextElements(): Element[] {
    const elements: Element[] = [];
    const selectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'div', 'button', 'a',
      'label', 'td', 'th', 'li'
    ];

    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text && this.originalTexts.has(el)) {
          elements.push(el);
        }
      });
    });

    return elements;
  }

  /**
   * Khôi phục text gốc
   */
  private restoreOriginalTexts() {
    this.originalTexts.forEach((originalText, element) => {
      const textNode = Array.from(element.childNodes).find(
        node => node.nodeType === Node.TEXT_NODE
      );
      
      if (textNode) {
        textNode.textContent = originalText;
      }
    });
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLang;
  }

  /**
   * Initialize
   */
  init() {
    const savedLang = localStorage.getItem('appLanguage') || 'vi';
    if (savedLang !== 'vi') {
      // Đợi DOM load xong rồi mới dịch
      setTimeout(() => {
        this.translatePage(savedLang);
      }, 1000);
    }
  }
}

export const autoTranslateService = new AutoTranslateService();