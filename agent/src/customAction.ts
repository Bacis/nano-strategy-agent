import {
    AgentKit,
    CdpWalletProvider,
    customActionProvider,
  } from "@coinbase/agentkit";
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { z } from "zod";

// Configure CDP Wallet Provider
const config = {
    apiKeyName: process.env.CDP_API_KEY_NAME,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    networkId: process.env.CDP_AGENT_KIT_NETWORK || "base-sepolia",
};

const walletProvider = await CdpWalletProvider.configureWithWallet(config);

const customSignMessage = customActionProvider<CdpWalletProvider>({ // wallet types specify which providers can use this action. It can be as generic as WalletProvider or as specific as CdpWalletProvider
    name: "sign_message",
    description: "Sign arbitrary messages using EIP-191 Signed Message Standard hashing",
    schema: z.object({
    message: z.string().describe("The message to sign"),
    }),
    invoke: async (walletProvider, args: any) => {
    const { message } = args;
    const signature = await walletProvider.signMessage(message);
    return `The payload signature ${signature}`;
    },
});

        // Initialize AgentKit
const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [
        customSignMessage,
    ],
});

export const signMessageAction: Action = {
    name: "SIGN_MESSAGE",
    similes: ["SIGN_MESSAGE"],
    description: "Sign arbitrary messages using EIP-191 Signed Message Standard hashing",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Validation logic
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // Implementation logic

        const actions = await agentkit.getActions();

        const results = await Promise.all(actions.map(async (action) => {
            const result = await action.invoke({
                message: "Hello, world!",
            });

            return result;
        }));

        console.log(results);

        return results[0];
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Sign the message 'Hello, world!'" },
            },
            {
                user: "{{user2}}",
                content: { text: "Response", action: "SIGN_MESSAGE" },
            },
        ],
    ],
};
