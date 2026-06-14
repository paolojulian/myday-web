import { Try } from "@/index";
import { responseError } from "@/utils/api";

type PriceRequestType = "crypto" | "stock";

export type PriceRequest = {
  type: PriceRequestType;
  key: string;
};

export type UpdatePricesRequest = {
  priceRequests: PriceRequest[];
};

export type UpdatePricesResponse = {
  type: PriceRequestType;
  key: string;
  price: number;
};

class InvestmentApi {
  private routes = {
    updatePrices: "/api/update-prices",
  };

  public async updatePrices(
    values: UpdatePricesRequest,
  ): Promise<Try<UpdatePricesResponse>> {
    try {
      const response = await fetch(this.routes.updatePrices, {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error("Failed to update prices");
      }
      const data = await response.json();

      return [data, null];
    } catch (e: unknown) {
      return [null, responseError(e, "Unable to update prices.")];
    }
  }
}

export const investmentApi = new InvestmentApi();
