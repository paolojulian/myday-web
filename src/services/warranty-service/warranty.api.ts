import { Try } from "@/index";
import { responseError } from "@/utils/api";

type StoreWarrantyReceiptRequest = {
  file: File | Blob;
  filename: string;
  contentType: string;
  user_id: string;
  title: string;
  expiration_date?: string;
};

export type StoreWarrantyReceiptResult = {
  image_url: string;
  image_public_id: string;
};

type StoreWarrantyReceiptApiResponse = {
  image?: {
    image_url: string;
    image_public_id: string;
  };
};

class WarrantyApi {
  private routes = {
    storeWarrantyReciept: "/api/store-warranty-receipt",
  };

  public async storeWarrantyReceipt(
    request: StoreWarrantyReceiptRequest,
  ): Promise<Try<StoreWarrantyReceiptResult>> {
    const formData = new FormData();
    // The image part carries its own filename + content type; the server reads
    // content_type/filename from this part.
    formData.append("image", request.file, request.filename);
    formData.append("user_id", request.user_id);
    formData.append("content_type", request.contentType);
    formData.append("filename", request.filename);
    formData.append("source", navigator.userAgent);
    formData.append("title", request.title);
    if (request.expiration_date) {
      formData.append("expiration_date", request.expiration_date);
    }

    try {
      // NOTE: send the FormData itself and do NOT set Content-Type — the browser
      // sets `multipart/form-data` with the correct boundary automatically.
      const response = await fetch(this.routes.storeWarrantyReciept, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Unable to store warranty receipt");
      }

      const json = (await response.json()) as StoreWarrantyReceiptApiResponse;
      if (!json.image?.image_url || !json.image?.image_public_id) {
        throw new Error("Warranty receipt upload returned no image URL");
      }

      return [
        {
          image_url: json.image.image_url,
          image_public_id: json.image.image_public_id,
        },
        null,
      ];
    } catch (e) {
      return [null, responseError(e, "Unable to store warranty receipt")];
    }
  }
}

export const warrantyApi = new WarrantyApi();
