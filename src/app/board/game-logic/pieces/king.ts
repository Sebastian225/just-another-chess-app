import { Coordinate, Piece, PieceTypes, PlayerColor } from "./piece";

export class King extends Piece {
    hasMoved = false;

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.KING);
    }

    override getAvailableMoves(): Coordinate[] {
        return [];
    }

}