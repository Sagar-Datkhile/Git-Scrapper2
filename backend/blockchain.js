/**
 * Blockchain Anchoring Module (Scaffolded)
 * 
 * This module provides a no-op scaffold for anchoring report hashes
 * to an EVM-compatible blockchain (e.g. Polygon). To enable it:
 * 
 * 1. Add to your .env:
 *    BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
 *    BLOCKCHAIN_PRIVATE_KEY=0x...your_private_key
 * 
 * 2. Install ethers: npm install ethers
 * 
 * 3. The anchorHash function will then submit a zero-value transaction
 *    with the hash embedded in the data field.
 */

export const anchorHash = async (hash) => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    // Blockchain not configured — graceful no-op
    return null;
  }

  try {
    // Dynamic import so ethers isn't required unless blockchain is enabled
    const { ethers } = await import('ethers');
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Send a zero-value transaction with the hash in the data field
    const tx = await wallet.sendTransaction({
      to: wallet.address, // self-transfer
      value: 0,
      data: ethers.toUtf8Bytes(hash)
    });

    await tx.wait();
    console.log(`Hash anchored on-chain: ${tx.hash}`);
    return tx.hash;
  } catch (err) {
    console.error('Blockchain anchoring failed:', err.message);
    return null;
  }
};
