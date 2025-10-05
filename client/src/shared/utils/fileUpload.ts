import { AttachmentItem } from "shared/types/attachment";

/**
 * Загрузка файла на сервер
 */
export const uploadFile = async (file: File, applicationId?: string): Promise<AttachmentItem> => {
  // Генерируем уникальный file_id
  const timestamp = Date.now();
  const fileId = applicationId 
    ? `${applicationId}-${timestamp}-${file.name}`
    : `app-${timestamp}-${file.name}`;

  // Получаем presigned URL для загрузки
  const presignedResp = await fetch(`https://smolathon.davg-team.ru/api/files/upload2?file_id=${encodeURIComponent(fileId)}`);
  
  if (!presignedResp.ok) {
    throw new Error('Ошибка получения URL для загрузки');
  }

  const { upload_url } = await presignedResp.json();

  // Загружаем файл напрямую без FormData для PUT запроса
  const uploadResponse = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream"
    }
  });

  if (!uploadResponse.ok) {
    throw new Error('Ошибка загрузки файла');
  }

  // Создаем объект вложения
  const attachment: AttachmentItem = {
    id: fileId,
    name: file.name,
    url: `/files/${fileId}`,
    size: file.size,
    type: file.type,
    uploadDate: new Date()
  };

  return attachment;
};

/**
 * Проверка, является ли файл изображением
 */
export const isImageFile = (file: File | AttachmentItem): boolean => {
  const type = 'type' in file ? file.type : '';
  return type.startsWith('image/');
};

/**
 * Форматирование размера файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Получить превью изображения из файла
 */
export const getImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Не удалось прочитать файл'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsDataURL(file);
  });
};
