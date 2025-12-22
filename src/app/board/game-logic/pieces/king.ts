import { Board, CastlingSide, Move } from "../board";
import { Coordinate, isInBounds, Piece, PieceTypes, PlayerColor } from "./piece";

export class King extends Piece {
    hasMoved: boolean = false;

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.KING);
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

            if (!isInBounds(targetPosition)) {
                continue;
            }

            const targetPiece = board.getPieceAt(targetPosition.x, targetPosition.y);

            if (!targetPiece || targetPiece.color !== this.color) {
                result.push({
                    piece: this,
                    from: {...this.position},
                    to: targetPosition,
                    isCapture: targetPiece !== null
                });
            }
        }

        if (this.hasMoved) {
            return result;
        }

        if (this.color === PlayerColor.WHITE){
            if (board.castlingRights.whiteKingSide && board.areCastleSquaresEmpty(this.color, CastlingSide.KINGSIDE)) {
                const move = {
                    piece: this,
                    from: {...this.position},
                    to: this.getCastlingPosition(CastlingSide.KINGSIDE),
                    isCastling: true
                }
                result.push(move);
            }
            if (board.castlingRights.whiteQueenSide && board.areCastleSquaresEmpty(this.color, CastlingSide.QUEENSIDE)) {
                const move = {
                    piece: this,
                    from: {...this.position},
                    to: this.getCastlingPosition(CastlingSide.QUEENSIDE),
                    isCastling: true
                }
                result.push(move);
            }
        }
        else {
            if (board.castlingRights.blackKingSide && board.areCastleSquaresEmpty(this.color, CastlingSide.KINGSIDE)) {
                const move = {
                    piece: this,
                    from: {...this.position},
                    to: this.getCastlingPosition(CastlingSide.KINGSIDE),
                    isCastling: true
                }
                result.push(move);
            }
            if (board.castlingRights.blackQueenSide && board.areCastleSquaresEmpty(this.color, CastlingSide.QUEENSIDE)) {
                const move = {
                    piece: this,
                    from: {...this.position},
                    to: this.getCastlingPosition(CastlingSide.QUEENSIDE),
                    isCastling: true
                }
                result.push(move);
            }
        }

        return result;
    }

    private getCastlingPosition(side: CastlingSide): Coordinate {
        if (side === CastlingSide.KINGSIDE){
            return {
                x: this.position.x + 2,
                y: this.position.y
            }
        }

        return {
            x: this.position.x - 2,
            y: this.position.y
        }
    }

    override move(x: number, y: number) {
        super.move(x,y);
        this.hasMoved = true;
    }

}