import { Board, Move } from "../board";
import { Constants } from "../utils/constants";
import { Coordinate, isInBounds, Piece, PieceTypes, PlayerColor } from "./piece";

export class Bishop extends Piece {

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.BISHOP);
    }

    override getPseudoLegalMoves(board: Board): Move[] {
        const result: Move[] = [];
        const directions = Constants.Directions.Diagonal;

        for (let direction of directions) {
            let targetPosition = {
                x: this.position.x + direction.x,
                y: this.position.y + direction.y
            }

            while (isInBounds(targetPosition)) {
                const targetPiece = board.getPieceAt(targetPosition.x, targetPosition.y);

                if (!targetPiece) {
                    result.push({
                        piece: this,
                        from: {...this.position},
                        to: targetPosition
                    });
                }
                else if (targetPiece.color !== this.color) {
                    result.push({
                        piece: this,
                        from: {...this.position},
                        to: targetPosition,
                        isCapture: true
                    });
                    break;
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