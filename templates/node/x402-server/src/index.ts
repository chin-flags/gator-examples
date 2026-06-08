import { config } from "dotenv";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { x402ExactEvmErc7710ServerScheme } from "@metamask/x402";

config();

const NETWORK_ID = "eip155:84532";
const PORT = 4402;

const payToAddress = process.env.PAY_TO_ADDRESS as string;
if (!payToAddress) {
  console.error("PAY_TO_ADDRESS environment variable is required");
  process.exit(1);
}

const facilitatorUrl = process.env.FACILITATOR_URL as string;
if (!facilitatorUrl) {
  console.error("FACILITATOR_URL environment variable is required");
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const app = express();
app.use(cors({ exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"] }));

app.use(
  paymentMiddleware(
    {
      "GET /api/hello": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network: NETWORK_ID,
            payTo: payToAddress,
          },
        ],
        description: "Access to protected resource",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register(
      NETWORK_ID,
      new x402ExactEvmErc7710ServerScheme(),
    ),
  ),
);

app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello!" });
});

app.listen(PORT, () => {
  console.log(`[seller] Server running on http://localhost:${PORT}`);
  console.log(`[seller] Pay-to address: ${payToAddress}`);
  console.log(`[seller] Facilitator URL: ${facilitatorUrl}`);
  console.log(`[seller] Network: ${NETWORK_ID}`);
});
