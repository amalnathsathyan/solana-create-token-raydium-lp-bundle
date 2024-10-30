import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import path from 'path';
import bs58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.SOLANA_DEVNET_URL as string;
const solanaConnection = new Connection(endpoint, 'confirmed');

const createWallets = (num: number) => {
    for (let i = 0; i < num; i++) {
        const keypair = Keypair.generate();
        console.log(`Keypair Generated`);
        const privateKey = bs58.encode(keypair.secretKey);
        const publicKey = keypair.publicKey.toString();
        console.log(`Wallet PrivateKey:`, privateKey);

        const filePath = path.join(__dirname, 'PrimaryWallets', `${publicKey}.json`);
        const secret_array = keypair.secretKey
            .toString() //convert secret key to string
            .split(',') //delimit string by commas and convert to an array of strings
            .map(value => Number(value)); //convert string values to numbers inside the array
        const secret = JSON.stringify(secret_array); //Covert to JSON string

        fs.writeFile(filePath, secret, 'utf8', function (err) {
            if (err) throw err;
            console.log(`Wrote secret key to ${publicKey}.json`);
        });
    }
}
//enter how many wallets you require
createWallets(20);