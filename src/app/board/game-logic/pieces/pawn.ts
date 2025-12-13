import { Piece, Coordinate, PlayerColor, PieceTypes } from "./piece";

export class Pawn extends Piece {
    hasMoved = false;

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.PAWN);
    }

    override getAvailableMoves(): Coordinate[] {
        return [];
    }
}
