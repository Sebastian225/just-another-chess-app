import { Piece, Coordinate, PlayerColor, PieceTypes } from "./piece";

export class Knight extends Piece {
    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.KNIGHT);
    }

    override getAvailableMoves(): Coordinate[] {
        return [];
    }
}
