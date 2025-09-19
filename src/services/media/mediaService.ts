import { api } from "../../config/axios";
import { API_ENDPOINTS } from "../../constants/config";
import { ApiResponse } from "../../types";

export interface UploadMediaRequest {
  file: {
    uri: string;
    type: string;
    name: string;
  };
  type: "image" | "video" | "audio" | "document";
}

export interface UploadMediaResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const mediaService = {
  async uploadMedia(
    fileData: UploadMediaRequest
  ): Promise<ApiResponse<UploadMediaResponse>> {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: fileData.file.uri,
        type: fileData.file.type,
        name: fileData.file.name,
      } as any);
      formData.append("type", fileData.type);

      const response = await api.post<ApiResponse<UploadMediaResponse>>(
        API_ENDPOINTS.PUBLIC.UPLOAD_MEDIA,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  },

  async uploadImage(
    imageUri: string,
    fileName?: string
  ): Promise<ApiResponse<UploadMediaResponse>> {
    const fileExtension = imageUri.split(".").pop() || "jpg";
    const defaultFileName = fileName || `image_${Date.now()}.${fileExtension}`;

    return this.uploadMedia({
      file: {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: defaultFileName,
      },
      type: "image",
    });
  },

  async uploadDocument(
    documentUri: string,
    fileName: string
  ): Promise<ApiResponse<UploadMediaResponse>> {
    const fileExtension = fileName.split(".").pop() || "";
    const mimeType = this.getMimeType(fileExtension);

    return this.uploadMedia({
      file: {
        uri: documentUri,
        type: mimeType,
        name: fileName,
      },
      type: "document",
    });
  },

  getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  },
};
