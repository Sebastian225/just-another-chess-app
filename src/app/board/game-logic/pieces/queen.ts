import { Board, Move } from "../board";
import { Coordinate, isInBounds, Piece, PieceTypes, PlayerColor } from "./piece";

export class Queen extends Piece {

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.QUEEN);
    }

    override getPseudoLegalMoves(board: Board): Move[] {
        const result: Move[] = [];
        const directions = [
            {x: -1, y: -1}, {x: 1, y: -1},
            {x: 1, y: 1}, {x: -1, y: 1},
            {x: 0, y: -1}, {x: 0, y: 1},
            {x: 1, y: 0}, {x: -1, y: 0}
        ];

        for (let direction of directions) {
            let targetPosition = {
                x: this.position.x + direction.x,
                y: this.position.y + direction.y
            }

            while (isInBounds(targetPosition)) {
                const targetPiece = board.getPieceAt(targetPosition.x, targetPosition.y);

                if (!targetPiece || targetPiece.color !== this.color) {
                    result.push({
                        piece: this,
                        from: {...this.position},
                        to: targetPosition
                    });
                }
                else {
                    break;
                }

                targetPosition = {
                    x: targetPosition.x + direction.x,
                    y: targetPosition.y + direction.y
                };
            }
        }

        return result;
    }

}