import { Board, Move } from "../board";
import { Piece, Coordinate, PlayerColor, PieceTypes, isInBounds } from "./piece";

export class Knight extends Piece {
    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.KNIGHT);
    }

    override getPseudoLegalMoves(board: Board): Move[] {
        const result: Move[] = [];

        const offsets = [
            { x: 1, y: 2 }, { x: 2, y: 1 },
            { x: 2, y: -1 }, { x: 1, y: -2 },
            { x: -1, y: -2 }, { x: -2, y: -1 },
            { x: -2, y: 1 }, { x: -1, y: 2 },
        ];

        for (let offset of offsets) {
            const targetPosition = {
                x: this.position.x + offset.x,
                y: this.position.y + offset.y,
            }

            if (!isInBounds(targetPosition)) {
                continue;
            }

            const targetPiece = board.getPieceAt(targetPosition.x, targetPosition.y);

            if (!targetPiece || targetPiece.color !== this.color) {
                result.push({
                    piece: this,
                    from: {...this.position},
                    to: targetPosition
                });
            }
        }

        return result;
    }
}
