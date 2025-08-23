
export interface DeviceFingerprintData {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  colorDepth: number;
  pixelRatio: number;
  touchSupport: boolean;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  maxTouchPoints: number;
}

export class DeviceFingerprintGenerator {
  private static instance: DeviceFingerprintGenerator;
  private fingerprintData: DeviceFingerprintData | null = null;

  private constructor() { }

  public static getInstance(): DeviceFingerprintGenerator {
    if (!DeviceFingerprintGenerator.instance) {
      DeviceFingerprintGenerator.instance = new DeviceFingerprintGenerator();
    }
    return DeviceFingerprintGenerator.instance;
  }

  public async generateFingerprint(): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Device fingerprinting can only be used in browser environment");
    }

    const data = await this.collectDeviceData();
    this.fingerprintData = data;

    // Criar uma string única baseada nos dados coletados
    const fingerprintString = [
      data.userAgent,
      data.screenResolution,
      data.timezone,
      data.language,
      data.platform,
      data.colorDepth.toString(),
      data.pixelRatio.toString(),
      data.touchSupport.toString(),
      data.cookieEnabled.toString(),
      data.doNotTrack || "null",
      data.hardwareConcurrency.toString(),
      data.maxTouchPoints.toString(),
    ].join("|");

    // Gerar hash SHA-256 do fingerprint
    return this.hashString(fingerprintString);
  }

  public getFingerprintData(): DeviceFingerprintData | null {
    return this.fingerprintData;
  }

  private async collectDeviceData(): Promise<DeviceFingerprintData> {
    const screen = window.screen;
    const navigator = window.navigator;

    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    };
  }

  private hashString(str: string): string {
    // Para o frontend, vamos usar uma implementação simples de hash
    // Em produção, considere usar uma biblioteca como crypto-js
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  }
}

// Hook para usar o device fingerprinting
export const useDeviceFingerprint = () => {
  const generator = DeviceFingerprintGenerator.getInstance();

  const generateFingerprint = async () => {
    try {
      return await generator.generateFingerprint();
    } catch (error) {
      console.error("Erro ao gerar fingerprint do dispositivo:", error);
      return null;
    }
  };

  const getFingerprintData = () => {
    return generator.getFingerprintData();
  };

  return {
    generateFingerprint,
    getFingerprintData,
  };
};