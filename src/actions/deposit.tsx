import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import {
  accrueInterestInstruction,
  depositInstruction,
  initReserveInstruction,
  LendingReserve,
} from "./../models/lending";
import { AccountLayout } from "@solana/spl-token";
import { LENDING_PROGRAM_ID } from "../utils/ids";
import {
  createUninitializedAccount,
  ensureSplAccount,
  findOrCreateAccountByMint,
} from "./account";
import { approve, TokenAccount } from "../models";
import { WalletAdapter } from "../contexts/wallet";

export const deposit = async (
  from: TokenAccount,
  amountLamports: number,
  reserve: LendingReserve,
  reserveAddress: PublicKey,
  connection: Connection,
  wallet: WalletAdapter
) => {
  if (!wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }

  notify({
    message: "Depositing funds...",
    description: "Please review transactions to approve.",
    type: "warn",
  });

  const isInitialized = true; // TODO: finish reserve init

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const [authority] = await PublicKey.findProgramAddress(
    [reserve.lendingMarket.toBuffer()], // which account should be authority
    LENDING_PROGRAM_ID
  );

  const fromAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    from,
    wallet.publicKey,
    amountLamports + accountRentExempt,
    signers
  );

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    fromAccount,
    wallet.publicKey,
    amountLamports
  );

  signers.push(transferAuthority);

  let toAccount: PublicKey;
  if (isInitialized) {
    // get destination account
    toAccount = await findOrCreateAccountByMint(
      wallet.publicKey,
      wallet.publicKey,
      instructions,
      cleanupInstructions,
      accountRentExempt,
      reserve.collateralMint,
      signers
    );
  } else {
    toAccount = createUninitializedAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      signers
    );
  }

  if (isInitialized) {
    instructions.push(accrueInterestInstruction(reserveAddress));

    // deposit
    instructions.push(
      depositInstruction(
        amountLamports,
        fromAccount,
        toAccount,
        reserveAddress,
        reserve.liquiditySupply,
        reserve.collateralMint,
        reserve.lendingMarket,
        authority,
        transferAuthority.publicKey,
      )
    );
  } else {
    // TODO: finish reserve init
    const MAX_UTILIZATION_RATE = 80;
    instructions.push(
      initReserveInstruction(
        amountLamports,
        MAX_UTILIZATION_RATE,
        fromAccount,
        toAccount,
        reserveAddress,
        reserve.liquidityMint,
        reserve.liquiditySupply,
        reserve.collateralMint,
        reserve.collateralSupply,
        reserve.lendingMarket,
        authority,
        transferAuthority.publicKey,
        reserve.dexMarket
      )
    );
  }

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true
    );

    notify({
      message: "Funds deposited.",
      type: "success",
      description: `Transaction - ${tx}`,
    });
  } catch {
    // TODO:
    throw new Error();
  }
};
