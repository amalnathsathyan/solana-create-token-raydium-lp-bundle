import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { Connection, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import dotenv from 'dotenv';
dotenv.config()

export const transferSpl = async () => {
    const endpoint = process.env.
} 