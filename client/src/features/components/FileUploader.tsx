import { useState, useRef, useEffect } from "react";
import {
  Card,
  Flex,
  Text,
  Button,
  Icon,
  useToaster,
} from "@gravity-ui/uikit";
import {
  ArrowUpFromLine,
  Xmark,
  FileText,
  Picture,
} from "@gravity-ui/icons";
import { AttachmentItem } from "shared/types/attachment";
import { uploadFile, isImageFile, formatFileSize, getImagePreview } from "shared/utils/fileUpload";

interface FileUploaderProps {
  attachments: AttachmentItem[];
  onAttachmentsChange: (attachments: AttachmentItem[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // в байтах
  disabled?: boolean;
}

interface FileWithPreview extends AttachmentItem {
  preview?: string;
  isUploading?: boolean;
}

const FileUploader = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB по умолчанию
  disabled = false,
}: FileUploaderProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toaster = useToaster();

  // Синхронизация с внешним состоянием
  useEffect(() => {
    const filesWithPreviews = attachments.map(att => {
      // Ищем существующий файл в локальном состоянии для сохранения preview
      const existingFile = files.find(f => f.id === att.id);
      return {
        ...att,
        preview: existingFile?.preview,
      };
    });
    setFiles(filesWithPreviews);
  }, [attachments]);

  // Создание preview для изображений без preview
  useEffect(() => {
    const loadPreviews = async () => {
      for (const file of files) {
        if (isImageFile(file) && !file.preview && !file.isUploading && file.url) {
          try {
            // Пытаемся создать preview из URL
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = `https://smolathon.davg-team.ru${file.url}`;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = Math.min(img.width, 200);
              canvas.height = Math.min(img.height, 200);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const preview = canvas.toDataURL('image/jpeg', 0.8);
              
              setFiles(prev => prev.map(f => 
                f.id === file.id ? { ...f, preview } : f
              ));
            }
          } catch (error) {
            console.error('Ошибка создания preview из URL:', error);
          }
        }
      }
    };

    loadPreviews();
  }, [files.filter(f => f.url && !f.preview && !f.isUploading).length]); // Зависимость от количества файлов без preview

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    const newFiles = Array.from(fileList);
    
    // Проверка количества файлов
    if (files.length + newFiles.length > maxFiles) {
      toaster.add({
        theme: "warning",
        title: `Максимум ${maxFiles} файлов`,
        name: "",
        autoHiding: 3000,
      });
      return;
    }

    // Проверка размера и загрузка файлов
    for (const file of newFiles) {
      if (file.size > maxFileSize) {
        toaster.add({
          theme: "warning",
          title: `Файл "${file.name}" слишком большой (макс. ${formatFileSize(maxFileSize)})`,
          name: "",
          autoHiding: 3000,
        });
        continue;
      }

      try {
        // Создаем временную запись с флагом загрузки
        const tempId = `temp-${Date.now()}-${file.name}`;
        const tempFile: FileWithPreview = {
          id: tempId,
          name: file.name,
          url: '',
          size: file.size,
          type: file.type,
          uploadDate: new Date(),
          isUploading: true,
        };

        // Если это изображение, создаем preview
        if (isImageFile(file)) {
          try {
            const preview = await getImagePreview(file);
            tempFile.preview = preview;
          } catch (err) {
            console.error('Ошибка создания превью:', err);
          }
        }

        // Добавляем временный файл
        setFiles(prev => [...prev, tempFile]);

        // Загружаем файл
        const uploadedFile = await uploadFile(file);
        
        // Заменяем временный файл на загруженный
        setFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { ...uploadedFile, preview: tempFile.preview, isUploading: false }
            : f
        ));

        // Обновляем внешнее состояние
        const updatedAttachments = [...attachments, uploadedFile];
        onAttachmentsChange(updatedAttachments);

        toaster.add({
          theme: "success",
          title: `Файл "${file.name}" загружен`,
          name: "",
          autoHiding: 2000,
        });
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        
        // Удаляем временный файл при ошибке
        setFiles(prev => prev.filter(f => !f.id.startsWith('temp-')));
        
        toaster.add({
          theme: "danger",
          title: `Ошибка загрузки "${file.name}"`,
          name: "",
          autoHiding: 3000,
        });
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    
    const newAttachments = attachments.filter(a => a.id !== fileId);
    onAttachmentsChange(newAttachments);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (disabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      await handleFileSelect(fileList.files);
    }
  };

  // Подписка на события paste
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener('paste', handlePasteEvent);
    return () => {
      document.removeEventListener('paste', handlePasteEvent);
    };
  }, [disabled, files, attachments]);

  return (
    <Flex direction="column" gap="2">
      {/* Область загрузки */}
      <Card
        view={isDragging ? "outlined" : "outlined"}
        spacing={{ p: "3" }}
        style={{
          border: isDragging ? "2px dashed var(--g-color-line-info)" : "2px dashed var(--g-color-line-generic)",
          backgroundColor: isDragging ? "var(--g-color-base-info-light)" : "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Flex direction="column" gap="2" alignItems="center">
          <Icon data={ArrowUpFromLine} size={24} />
          <Text variant="body-2" style={{ textAlign: "center" }}>
            Перетащите файлы сюда, нажмите для выбора или вставьте (Ctrl+V)
          </Text>
          <Text variant="caption-2" color="secondary" style={{ textAlign: "center" }}>
            Максимум {maxFiles} файлов, до {formatFileSize(maxFileSize)} каждый
          </Text>
        </Flex>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
          disabled={disabled}
          accept="*/*"
        />
      </Card>

      {/* Список загруженных файлов */}
      {files.length > 0 && (
        <Flex direction="column" gap="2">
          {files.map((file) => (
            <Card key={file.id} view="outlined" spacing={{ p: "2" }}>
              <Flex justifyContent="space-between" alignItems="center" gap="2">
                <Flex gap="2" alignItems="center" style={{ flex: 1, minWidth: 0 }}>
                  {/* Превью для изображений */}
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Icon
                      data={file.type.startsWith('image/') ? Picture : FileText}
                      size={24}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  
                  <Flex direction="column" gap="0" style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      variant="body-2"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </Text>
                    <Text variant="caption-2" color="secondary">
                      {formatFileSize(file.size)}
                      {file.isUploading && " • Загрузка..."}
                    </Text>
                  </Flex>
                </Flex>

                {!file.isUploading && (
                  <Button
                    view="flat-secondary"
                    size="s"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                    disabled={disabled}
                  >
                    <Icon data={Xmark} />
                  </Button>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default FileUploader;
