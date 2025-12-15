import { Board } from "../board";
import { Piece, Coordinate, PlayerColor, PieceTypes } from "./piece";

export class Pawn extends Piece {
    hasMoved = false;

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.PAWN);
    }

    override getPseudoLegalMoves(board: Board): Coordinate[] {
        const result: Coordinate[] = [];

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
            result.push(forward1);

            if (!this.hasMoved && !board.getPieceAt(forward2.x, forward2.y)){
                result.push(forward2);
            }
        }

        for (const dx of [-1, 1]) {
            const targetPosition: Coordinate = {
                x: this.position.x + dx,
                y: this.position.y + direction
            }
            const target = board.getPieceAt(targetPosition.x, targetPosition.y);
            if (target && target.color !== this.color) {
                result.push(targetPosition);
            }
        }

        return result;
    }

    override move(x: number, y: number) {
        super.move(x, y);
        this.hasMoved = true;
    }
}
