export const verifyIPFSHash = (hash: string): boolean => {
    // Basic IPFS hash validation (Qm... format)
    const ipfsHashRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[A-Za-z2-7]{55})$/;
    return ipfsHashRegex.test(hash);
};

export const formatCIDForConsole = (cid: any): string => {
    if (typeof cid === 'string') return cid;
    if (cid && cid.cid) return cid.cid;
    if (cid && cid.hash) return cid.hash;
    return JSON.stringify(cid);
};
