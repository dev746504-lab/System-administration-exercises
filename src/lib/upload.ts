export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Khớp với allowed_formats phía backend (src/uploads/uploads.service.ts). */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
};

export function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES[file.type]) return `${file.name}: định dạng không được hỗ trợ`;
  if (file.size > MAX_FILE_SIZE) return `${file.name}: vượt quá 20MB`;
  return null;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
}

/** Upload thẳng từ browser lên Cloudinary bằng chữ ký backend cấp — không đi qua backend. */
export function uploadToCloudinary(file: File, sig: UploadSignature, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("allowed_formats", sig.allowedFormats);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((JSON.parse(xhr.responseText).secure_url as string));
      } else {
        reject(new Error("Tải file lên thất bại"));
      }
    };
    xhr.onerror = () => reject(new Error("Tải file lên thất bại"));
    xhr.send(form);
  });
}
