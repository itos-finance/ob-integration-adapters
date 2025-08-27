// Utility functions around ClosureIds (CIDs)
export class CID {

    static tokenCount(cid: number): number {
        let count = 0;
        while (cid > 0) {
            if ((cid & 1) === 1) count++;
            cid >>= 1;
        }
        return count;
    }
}