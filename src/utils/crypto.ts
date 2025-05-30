/**
 * 简单的加密和解密工具
 * 注意：这种加密方式不适合高安全性要求的场景，仅用于基本的数据混淆
 */

// 简单的加密密钥
const CRYPTO_KEY = 'class_teacher_system_2025';

/**
 * 简单加密字符串
 * @param text 要加密的文本
 * @returns 加密后的文本
 */
export const encrypt = (text: string): string => {
  if (!text) return '';
  
  // 基于XOR运算的简单加密
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length);
    result += String.fromCharCode(charCode);
  }
  
  // 转换为Base64编码
  return btoa(result);
};

/**
 * 解密字符串
 * @param encryptedText 加密后的文本
 * @returns 解密后的原始文本
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  try {
    // 从Base64解码
    const base64Decoded = atob(encryptedText);
    
    // 使用相同的XOR运算解密
    let result = '';
    for (let i = 0; i < base64Decoded.length; i++) {
      const charCode = base64Decoded.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error('解密失败:', error);
    return '';
  }
}; 