import { supabase } from '@/lib/supabaseClient';

interface UploadImageOptions {
  bucket: 'avisos' | 'avatars';
  folder: string;
  maxWidth?: number;
  quality?: number;
}

export interface UploadImageResult {
  url: string;
  usedFallback: boolean;
  errorMessage?: string;
}

const compressImageToBlobAndDataUrl = (
  file: File,
  maxWidth = 1280,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao comprimir imagem.'));
              return;
            }
            resolve({ blob, dataUrl });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
};

export const uploadMediaFile = async (
  file: File,
  { bucket, folder, maxWidth = 1280, quality = 0.82 }: UploadImageOptions
): Promise<UploadImageResult> => {
  const { blob, dataUrl } = await compressImageToBlobAndDataUrl(file, maxWidth, quality);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const filePath = `${folder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (!uploadError) {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (publicUrl) {
      return { url: publicUrl, usedFallback: false };
    }
  }

  // Fallback to secondary bucket 'avisos' if 'avatars' isn't provisioned yet
  if (bucket !== 'avisos') {
    const fallbackPath = `avatars/${folder}/${uniqueName}`;
    const { error: secondaryError } = await supabase.storage
      .from('avisos')
      .upload(fallbackPath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (!secondaryError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('avisos').getPublicUrl(fallbackPath);
      if (publicUrl) {
        return { url: publicUrl, usedFallback: false };
      }
    }
  }

  // Guaranteed resilient fallback: compressed JPEG data URL so images always display
  return {
    url: dataUrl,
    usedFallback: true,
    errorMessage: uploadError?.message,
  };
};
