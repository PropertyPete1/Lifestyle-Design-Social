export declare class CartoonService {
    cartoonPath: string;
    constructor();
    createCompleteCartoon(userId: string): Promise<any>;
    getCartoonStats(): {
        totalCartoons: number;
        recentCartoons: any[];
    };
}
export default CartoonService;
//# sourceMappingURL=cartoonService.d.ts.map