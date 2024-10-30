import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction
} from '@solana/web3.js';

import {
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    mintTo,
    createAssociatedTokenAccountIdempotent,
    AuthorityType,
    createInitializeMetadataPointerInstruction,
    TYPE_SIZE,
    LENGTH_SIZE,
    getMintLen,
    ExtensionType,
    getMint,
    getMetadataPointerState,
    getTokenMetadata,
    createSetAuthorityInstruction,
} from '@solana/spl-token';
import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    createRemoveKeyInstruction,
    pack,
    TokenMetadata,
} from '@solana/spl-token-metadata';

//save your keypair file in home folder
import secret from '../2vBAnVajtqmP4RBm8Vw5gzYEy3XCT9Mf1NBeQ2TPkiVF.json'
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.SOLANA_DEVNET_URL as string;
const connection = new Connection(endpoint, 'confirmed');
const admin = Keypair.fromSecretKey(new Uint8Array(secret));
const payer = admin;
const authority = admin;
const owner = admin;
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

const tokenMetadata: TokenMetadata = {
    updateAuthority: authority.publicKey,
    mint: mint,
    name: 'THE TOKEN IS RUSTY',
    symbol: 'RUSTY2',
    uri: "https://dweb.link/ipfs/Qma5VS5zQ6fGusmkDME5J68MvS9MvFMV44zkxWatUmqiQ2", // URI to a richer metadata
    additionalMetadata: [['','']],
};

const decimals = 6;
const mintAmount = 21000000_000_000 // Supply 21M 

function generateExplorerUrl(identifier: string, isAddress: boolean = false): string {
    if (!identifier) return '';
    const baseUrl = 'https://solana.fm';
    const localSuffix = '?cluster=devnet-alpha';
    const slug = isAddress ? 'address' : 'tx';
    return `${baseUrl}/${slug}/${identifier}${localSuffix}`;
}
async function createTokenAndMint(): Promise<[string, string]> {
    // Calculate the minimum balance for the mint account
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    // Prepare transaction
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
            mint,
            authority.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeMintInstruction(
            mint,
            decimals,
            authority.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: authority.publicKey,
            mint: mint,
            mintAuthority: authority.publicKey,
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            uri: tokenMetadata.uri,
        }),
        createUpdateFieldInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: authority.publicKey,
            field: tokenMetadata.additionalMetadata[0][0],
            value: tokenMetadata.additionalMetadata[0][1],
        }),
    
    );
    // Initialize Token with metadata
    const initSig = await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair, authority]);
    // Create associated token account
    const sourceAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
    // Mint Token to associated token account
    const mintSig = await mintTo(connection, payer, mint, sourceAccount, authority, mintAmount, [], undefined, TOKEN_2022_PROGRAM_ID);
    return [initSig, mintSig];
}

(async () => {
    const [initSig, mintSig] = await createTokenAndMint();
    console.log(`Token created and minted:`);
    console.log(`   ${generateExplorerUrl(initSig)}`);
    console.log(`   ${generateExplorerUrl(mintSig)}`);
    console.log(`New Token:`);
    console.log(`   ${generateExplorerUrl(mint.toBase58(), true)}`);
    console.log(await getTokenMetadata(connection, mint));
})();