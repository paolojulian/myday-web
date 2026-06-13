import { Try } from "@/index";
import { responseError } from "@/utils/api";

type StoreWarrantyReceiptRequest = {
  file: File;
  user_id: string;
  title: string;
  expiration_date?: string;
};

class WarrantyApi {
  private routes = {
    storeWarrantyReciept: "/api/store-warranty-receipt",
  };

  public async storeWarrantyReceipt(
    request: StoreWarrantyReceiptRequest,
  ): Promise<Try<null>> {
    const formData = new FormData();
    formData.append("image", request.file);
    formData.append("user_id", request.user_id);
    formData.append("content_type", request.file.type);
    formData.append("filename", request.file.name);
    formData.append("source", navigator.userAgent);
    formData.append("title", request.title);
    if (request.expiration_date) {
      formData.append("expiration_date", request.expiration_date);
    }

    try {
      const response = await fetch(this.routes.storeWarrantyReciept, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        throw new Error("Unable to store warranty receipt");
      }

      return [null, null];
    } catch (e) {
      return [null, responseError(e, "Unable to store warranty receipt")];
    }
  }
}

export const warrantyApi = new WarrantyApi();
