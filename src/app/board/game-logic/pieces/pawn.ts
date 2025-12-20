import { Board, Move } from "../board";
import { Piece, Coordinate, PlayerColor, PieceTypes } from "./piece";

export class Pawn extends Piece {
    hasMoved = false;
    static readonly promotionTypes: PieceTypes[] = [
        PieceTypes.QUEEN,
        PieceTypes.ROOK,
        PieceTypes.BISHOP,
        PieceTypes.KNIGHT
    ]

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.PAWN);
    }

    override getPseudoLegalMoves(board: Board): Move[] {
        const result: Move[] = [];

        const direction = this.color === PlayerColor.WHITE ? -1 : 1;

        if (this.position.y + direction > 7 || this.position.y + direction < 0) {
            return [];
        }

        const forward1: Coordinate = {
            x: this.position.x,
            y: this.position.y + direction
        }
        const forward2: Coordinate = {
            x: this.position.x,
            y: forward1.y + direction
        }
        if (!board.getPieceAt(forward1.x, forward1.y)) {
            result.push(...this.checkAndAddPromotions(forward1)); 

            if (!this.hasMoved && !board.getPieceAt(forward2.x, forward2.y)){
                result.push(...this.checkAndAddPromotions(forward2)); 
            }
        }

        for (const dx of [-1, 1]) {
            const targetPosition: Coordinate = {
                x: this.position.x + dx,
                y: this.position.y + direction
            }
            const target = board.getPieceAt(targetPosition.x, targetPosition.y);
            if (target && target.color !== this.color) {
                result.push(...this.checkAndAddPromotions(targetPosition)); 
            }

            if (!target && board.enPassantSquare && board.enPassantSquare.x == targetPosition.x && board.enPassantSquare.y == targetPosition.y) {
                result.push(...this.checkAndAddPromotions(targetPosition, true)); 
            }
        }

        return result;
    }

    override move(x: number, y: number) {
        super.move(x, y);
        this.hasMoved = true;
    }

    private isPromotionSquare(position: Coordinate): boolean {
        if (this.color === PlayerColor.WHITE && position.y == 0) {
            return true;
        }
        if (this.color === PlayerColor.BLACK && position.y == 7) {
            return true;
        }
        
        return false;
    }

    private checkAndAddPromotions(destination: Coordinate, isEnPassant?: boolean): Move[] {
        let result: Move[] = [];

        if (!this.isPromotionSquare(destination)){
            result.push({
                piece: this,
                from: {...this.position},
                to: destination,
                isEnPassant: isEnPassant
            });

            return result;
        }

        for (let type of Pawn.promotionTypes) {
            result.push({
                piece: this,
                from: {...this.position},
                to: destination,
                promotion: type
            });
        }

        return result;
    }
}
