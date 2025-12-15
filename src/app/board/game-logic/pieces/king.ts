import { Board } from "../board";
import { Coordinate, isInBounds, Piece, PieceTypes, PlayerColor } from "./piece";

export class King extends Piece {
    hasMoved = false;

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.KING);
    }

    override getPseudoLegalMoves(board: Board): Coordinate[] {
        const result: Coordinate[] = [];
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

            if (!isInBounds(targetPosition)) {
                continue;
            }

            const targetPiece = board.getPieceAt(targetPosition.x, targetPosition.y);

            if (!targetPiece) {
                result.push(targetPosition);
            }
            else if (targetPiece.color !== this.color) {
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