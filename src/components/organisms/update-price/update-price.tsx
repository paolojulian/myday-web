import { investmentApi } from "@/services/investment-service/investment.api";
import { PTypography } from "@paolojulian.dev/design-system";
import { useMutation } from "@tanstack/react-query";

export const UpdatePrice = () => {
  const { mutate } = useMutation({
    mutationFn: investmentApi.updatePrices.bind(investmentApi),
  });

  const handleClick = () => {
    mutate({
      priceRequests: [
        {
          type: "crypto",
          key: "btc",
        },
        {
          type: "crypto",
          key: "eth",
        },
        {
          type: "stock",
          key: "qqq",
        },
      ],
    });
  };

  return (
    <button onClick={handleClick}>
      <PTypography>Update Prices</PTypography>
    </button>
  );
};
